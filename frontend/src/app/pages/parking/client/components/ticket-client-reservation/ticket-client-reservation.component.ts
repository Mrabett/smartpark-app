import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { jsPDF } from 'jspdf';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-ticket-client-reservation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, QRCodeModule],
  providers: [DatePipe],
  templateUrl: './ticket-client-reservation.component.html',
  styleUrls: ['./ticket-client-reservation.component.css']
})
export class TicketClientReservationComponent implements OnInit {
  res: any = null;
  loading = true;
  error = false;

  ticketStatusMessage = '';
  ticketStatusColor = '';

  montantBase = 0;
  fraisSortieTardive = 0;
  remiseArriveeTardive = 0;
  montantFinal = 0;
  statutPassage: 'normal' | 'sortie-tardive' | 'arrivee-tardive' = 'normal';
  retardSortieMinutes = 0;
  retardArriveeMinutes = 0;
  calculEnCours = false;

  private route = inject(ActivatedRoute);
  private ParkingReservationService = inject(ParkingReservationService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ParkingReservationService.getReservationById(id).subscribe({
        next: (data) => {
          console.log("Données DTO reçues :", data); // 👀 Vérifie ici dans F12
          this.res = data;
          this.initialiserStatut(data);
          this.calculerMontantClient(data);
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        }
      });
    }
  }

  private fixDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    return typeof dateInput === 'string' ? new Date(dateInput.replace(' ', 'T')) : new Date(dateInput);
  }

  private initialiserStatut(data: any): void {
    const dateSortie = this.fixDate(data.datetimeSortie);
    const dateEntree = this.fixDate(data.datetimeEntree);
    const maintenant = new Date();

    if (dateSortie < maintenant) {
      this.ticketStatusMessage = "❌ RÉSERVATION EXPIRÉE";
      this.ticketStatusColor = "#d32f2f";
    } else if (dateEntree > maintenant) {
      this.ticketStatusMessage = "⏳ À VENIR";
      this.ticketStatusColor = "#f57c00";
    } else {
      this.ticketStatusMessage = "✅ EN COURS";
      this.ticketStatusColor = "#388e3c";
    }
  }

  private calculerMontantClient(reservation: any): void {
    this.calculEnCours = true;
    this.montantBase = reservation.montant || 0;
    const maintenant = new Date();
    const entree = this.fixDate(reservation.datetimeEntree);
    const sortiePrevue = this.fixDate(reservation.datetimeSortie);
    const statut = reservation.statusAction || 'ATTENTE';

    const tarifH = reservation.tarifDepassement || 0;
    const tarifRemiseH = reservation.remiseRetard || 0;

    // Réinitialisation
    this.statutPassage = 'normal';
    this.fraisSortieTardive = 0;
    this.remiseArriveeTardive = 0;
    this.retardSortieMinutes = 0;
    this.retardArriveeMinutes = 0;

    // Logique pour le client SPONTANÉ
    if (reservation.spontane || statut === 'EN_COURS') {
      if (statut === 'ENTREE_VALIDEE' || statut === 'EN_COURS' || statut === 'EN_ATTENTE' || statut === 'EN STATIONNEMENT') {
        const tempsEcouleMs = maintenant.getTime() - entree.getTime();
        const heuresEcoulees = Math.max(1, Math.ceil(tempsEcouleMs / 3600000));

        this.statutPassage = 'normal'; // Le spontané n'est jamais en retard
        this.retardSortieMinutes = 0;
        this.fraisSortieTardive = 0;

        // On utilise un tarif par défaut de 5 TND/h si non précisé
        const tarifHoraire = (tarifH > 0) ? tarifH : 5;
        this.montantBase = heuresEcoulees * tarifHoraire; // Le montant s'accumule dans le prix initial
        this.montantFinal = this.montantBase;
      } else {
        this.montantBase = reservation.montantFinal ?? 0;
        this.montantFinal = this.montantBase;
        this.statutPassage = 'normal';
        this.fraisSortieTardive = 0;
      }
    }
    // Logique client WEB standard (avec date prévisionnelle)
    else {
      // Si on est encore en attente d'entrée
      if (statut === 'ATTENTE' || statut === 'À VENIR') {
        if (maintenant > entree) {
          const diffMs = maintenant.getTime() - entree.getTime();
          this.retardArriveeMinutes = Math.floor(diffMs / 60000);
          const heuresPleines = Math.floor(diffMs / 3600000);
          if (heuresPleines >= 1) {
            this.statutPassage = 'arrivee-tardive';
            this.remiseArriveeTardive = +(heuresPleines * tarifRemiseH).toFixed(2);
          }
        }
        this.montantFinal = +(this.montantBase - this.remiseArriveeTardive).toFixed(2);
      }
      // Si la voiture est déjà dans le parking
      else if (statut === 'ENTREE_VALIDEE' || statut === 'EN STATIONNEMENT') {
        this.montantFinal = reservation.montantFinal ?? this.montantBase; // Montant figé lors de l'entrée
        if (maintenant > sortiePrevue) {
          this.statutPassage = 'sortie-tardive';
          const diffMs = maintenant.getTime() - sortiePrevue.getTime();
          this.retardSortieMinutes = Math.floor(diffMs / 60000);
          const heuresPleines = Math.ceil(diffMs / 3600000); // Toute heure entamée est due
          this.fraisSortieTardive = heuresPleines >= 1 ? +(heuresPleines * tarifH).toFixed(2) : 0;
          this.montantFinal = +(this.montantFinal + this.fraisSortieTardive).toFixed(2);
        }
      }
      // Si la réservation est clôturée
      else {
        this.montantFinal = reservation.montantFinal ?? this.montantBase;
      }
    }

    if (this.montantFinal < 0) this.montantFinal = 0;
    this.calculEnCours = false;
  }


  getTicketUrl(id: string): string { return `${window.location.origin}/ticket/${id}`; }
  downloadAsPDF(): void { /* ... code jspdf ... */ }
  goBack(): void { window.history.back(); }
}