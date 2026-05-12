import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { jsPDF } from 'jspdf';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QRCodeModule } from 'angularx-qrcode';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-ticket-reservation',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    QRCodeModule,
    MatDividerModule,
    MatChipsModule,
    FormsModule
  ],
  providers: [DatePipe],
  templateUrl: './ticket-reservation.component.html',
  styleUrls: ['./ticket-reservation.component.css']
})
export class TicketReservationComponent implements OnInit {

  res: any = null;
  loading = true;
  error = false;

  montantTotalFinal: number = 0;
  editingMatricule = false;
  newMatricule = '';
  statusAction: string = 'EN_ATTENTE';
  private route = inject(ActivatedRoute);
  private reservationService = inject(ParkingReservationService);

  private timerSub: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReservation(id);
      this.timerSub = setInterval(() => {
        if (this.res && this.statusAction !== 'SORTIE_VALIDEE') {
          // 📡 Poll de la Mémoire Tampon de la Caméra d'Entrée IA (Zéro-OCR)
          if ((this.statusAction === 'EN_ATTENTE' || this.statusAction === 'ATTENTE') && !this.res.imageEntree) {
            this.reservationService.getLatestEntryImage().subscribe({
              next: (data: any) => {
                if (data && data.image) {
                  console.log("📸 Image tampon récupérée avec l'horodatage :", data.timestamp);
                  this.res.imageEntree = data.image; // Apparition Magique de la photo d'entrée
                }
              }
            });
          }

          // 📡 Poll de la Mémoire Tampon de la Caméra de Sortie IA
          if (this.statusAction === 'ENTREE_VALIDEE' && !this.res.imageSortie) {
            this.reservationService.getLatestExitImage().subscribe({
              next: (data) => {
                if (data && data.image) {
                  this.res.imageSortie = data.image; // Apparition Magique de la photo
                }
              }
            });
          }
          this.calculerMontantEnTempsReel();
        }
      }, 3000);
    }
  }

  ngOnDestroy(): void {
    if (this.timerSub) clearInterval(this.timerSub);
  }

  // Correction compatibilité Safari/iPhone
  private fixDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    if (typeof dateInput === 'string') return new Date(dateInput.replace(' ', 'T'));
    return new Date(dateInput);
  }

  loadReservation(id: string): void {
    this.reservationService.getReservationById(id).subscribe({
      next: (data) => {
        this.res = data;
        this.statusAction = (data.statusAction || 'EN_ATTENTE').toUpperCase();
        console.log("🎟️ Statut du ticket ouvert :", this.statusAction);

        // 📡 Récupération immédiate au chargement (pas besoin d'attendre 3s)
        if ((this.statusAction === 'EN_ATTENTE' || this.statusAction === 'ATTENTE') && !this.res.imageEntree) {
          console.log("🔁 Tentative de récupération immédiate de l'image tampon...");
          this.reservationService.getLatestEntryImage().subscribe((imgData: any) => {
            if (imgData && imgData.image) {
              console.log("✅ Image récupérée avec succès au chargement !");
              this.res.imageEntree = imgData.image;
            } else {
              console.log("⚠️ Aucune image valide dans le tampon à cet instant.");
            }
          });
        }

        this.calculerMontantEnTempsReel();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  private calculerMontantEnTempsReel(): void {
    const base = this.res.montant || 0;
    const statut = this.statusAction;
    const maintenant = new Date();
    const entree = this.fixDate(this.res.datetimeEntree);

    // Robustesse: Spontané si flag true ou s'il n'y a délibérément pas de date de sortie
    const isSpontane = this.res.spontane === true || this.res.spontane === 'true' || !this.res.datetimeSortie;

    // 1. CAS CLIENT SPONTANÉ
    if (isSpontane) {
      if (statut === 'ENTREE_VALIDEE' || statut === 'EN_COURS' || statut === 'EN_ATTENTE' || statut === 'EN STATIONNEMENT') {
        const tempsEcouleMs = maintenant.getTime() - entree.getTime();
        // S'il est là depuis moins de 0ms (anomalie de temps), on compte 1h mini.
        const heuresEcoulees = Math.max(1, Math.ceil(tempsEcouleMs / 3600000));

        // Le tarif par heure pour un spontané : on utilise tarifDepassement, sinon un défaut (5 TND)
        const tarifHoraire = (this.res.tarifDepassement && this.res.tarifDepassement > 0) ? this.res.tarifDepassement : 5;
        this.montantTotalFinal = heuresEcoulees * tarifHoraire;
      } else {
        this.montantTotalFinal = this.res.montantFinal ?? 0;
      }
      return;
    }

    // 2. CAS RÉSERVATION WEB
    const sortiePrevue = this.fixDate(this.res.datetimeSortie);
    // Si tarif dépassement non configuré, on utilise 5 par défaut pour forcer le comptage
    const tarifH = (this.res.tarifDepassement && this.res.tarifDepassement > 0) ? this.res.tarifDepassement : 5;
    const tarifRemiseH = (this.res.remiseRetard && this.res.remiseRetard > 0) ? this.res.remiseRetard : 2;

    if (statut === 'EN_ATTENTE' || statut === 'EN_COURS' || statut === 'ATTENTE') {
      let remise = 0;
      if (maintenant > entree) {
        const heuresPleines = Math.floor((maintenant.getTime() - entree.getTime()) / 3600000);
        if (heuresPleines >= 1) remise = +(heuresPleines * tarifRemiseH).toFixed(2);
      }
      this.montantTotalFinal = Math.max(0, base - remise);
    } else if (statut === 'ENTREE_VALIDEE') {
      let penalite = 0;
      const montantFige = this.res.montantFinal ?? base;
      if (maintenant > sortiePrevue) {
        // depassement facturé à toute heure entamée (ceil au lieu de floor)
        const heuresPleines = Math.ceil((maintenant.getTime() - sortiePrevue.getTime()) / 3600000);
        if (heuresPleines >= 1) penalite = +(heuresPleines * tarifH).toFixed(2);
      }
      this.montantTotalFinal = montantFige + penalite;
    } else {
      this.montantTotalFinal = this.res.montantFinal ?? base;
    }
  }

  // ─── Actions employé ───────────────────────
  startEditMatricule(): void {
    this.newMatricule = this.res.matricule;
    this.editingMatricule = true;
  }

  saveMatricule(): void {
    if (!this.newMatricule || this.newMatricule.trim() === '') return;
    const payload = { ...this.res, matricule: this.newMatricule.toUpperCase() };
    this.reservationService.updateReservation(this.res.id, payload).subscribe({
      next: (updated) => {
        this.res.matricule = updated.matricule;
        this.editingMatricule = false;
      },
      error: () => alert('Erreur lors de la mise à jour du matricule')
    });
  }

  cancelEditMatricule(): void {
    this.editingMatricule = false;
  }

  validerEntree(): void {
    this.calculerMontantEnTempsReel();
    this.saveFluxChange('ENTREE_VALIDEE', {
      statusAction: 'ENTREE_VALIDEE',
      montantFinal: this.montantTotalFinal,
      // ✅ On confirme que l'imageEntree déjà stockée est validée
      imageEntree: this.res.imageEntree
    });
  }

  validerSortie(): void {
    this.calculerMontantEnTempsReel();
    this.saveFluxChange('SORTIE_VALIDEE', {
      statusAction: 'SORTIE_VALIDEE',
      montantFinal: this.montantTotalFinal,
      // ✅ On confirme l'imageSortie au moment de la validation
      imageSortie: this.res.imageSortie
    });
  }

  private saveFluxChange(newStatus: string, payload: any): void {
    if (!this.res?.id) return;
    this.reservationService.validerFlux(this.res.id, payload).subscribe({
      next: (updated: any) => {
        this.res = updated;
        this.statusAction = updated.statusAction;
        this.montantTotalFinal = updated.montantFinal ?? this.montantTotalFinal;
        alert(`✅ État "${newStatus}" enregistré.`);
      },
      error: () => alert('❌ Erreur lors de la mise à jour.')
    });
  }

  // ─── Helpers d'affichage ───────────────────

  get peutValiderEntree(): boolean {
    return this.statusAction === 'EN_COURS' || this.statusAction === 'EN_ATTENTE' || this.statusAction === 'ATTENTE';
  }

  get peutValiderSortie(): boolean {
    return this.statusAction === 'ENTREE_VALIDEE';
  }

  get imageSortieDisponible(): boolean {
    return !!this.res?.imageSortie;
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': '⏳ En attente',
      'EN_COURS': '🔍 Détecté par IA',
      'ENTREE_VALIDEE': '✅ En stationnement',
      'SORTIE_VALIDEE': '🏁 Sorti',
    };
    return labels[this.statusAction] ?? this.statusAction;
  }

  get statusColor(): string {
    const colors: Record<string, string> = {
      'EN_ATTENTE': 'accent',
      'EN_COURS': 'warn',
      'ENTREE_VALIDEE': 'primary',
      'SORTIE_VALIDEE': '',
    };
    return colors[this.statusAction] ?? '';
  }

  getTicketUrl(id: string): string {
    return `${window.location.origin}/ticket-client/${id}`;
  }

  ouvrirTicketClient(): void {
    window.open(this.getTicketUrl(this.res.id), '_blank');
  }

  downloadAsPDF(): void {
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] });
    doc.setFontSize(14);
    doc.text('TICKET PARKING', 40, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Matricule : ${this.res.matricule}`, 10, 30);
    doc.text(`Entrée    : ${this.res.datetimeEntree}`, 10, 38);
    doc.text(`Sortie    : ${this.res.datetimeSortie}`, 10, 46);
    doc.text(`Statut    : ${this.statusAction}`, 10, 54);
    doc.setFontSize(12);
    doc.text(`TOTAL : ${this.montantTotalFinal.toFixed(2)} TND`, 10, 68);
    doc.save(`Ticket_${this.res.id}.pdf`);
  }

  printTicket(): void {
    window.print();
  }
}