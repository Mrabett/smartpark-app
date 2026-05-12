import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReservationService } from '../../../services/reservation.service';
import { TerrainService } from '../../../services/terrain.service';
import { TarifDynamiqueService } from '../../../services/tarif-dynamique.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, KeyValuePipe],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss'
})
export class ReservationFormComponent implements OnInit {

  reservation: any = {
    terrainId: '', clientNom: '', clientEmail: '',
    clientTel: '', dateReservation: '', heureDebut: '',
    heureFin: '', notes: ''
  };

  terrains: any[]    = [];
  erreur             = '';
  loading            = false;
  tarifInfo: any     = null;
  suggestions: any[] = [];
  montantEstime      = 0;
  loadingTarif       = false;

  constructor(
    private svc: ReservationService,
    private terrainSvc: TerrainService,
    private tarifSvc: TarifDynamiqueService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.reservation.dateReservation =
      new Date().toISOString().split('T')[0];

    this.terrainSvc.getAll().subscribe(t => {
      this.terrains = t;
      const tid = this.route.snapshot.queryParams['terrainId']
               || this.route.snapshot.params['id'];
      if (tid) {
        this.reservation.terrainId = tid;
        this.updateTarif();
      }
    });

    const currentUser = this.authService.getUser();
    if (currentUser?.email) {
      this.reservation.clientEmail = currentUser.email;
    }
    if (currentUser?.nom) {
      this.reservation.clientNom = currentUser.nom;
    }
  }

  updateTarif() {
    const { terrainId, dateReservation, heureDebut, heureFin } =
      this.reservation;

    if (!terrainId || !dateReservation || !heureDebut) {
      this.tarifInfo    = null;
      this.montantEstime = 0;
      return;
    }

    this.loadingTarif = true;

    this.tarifSvc.calculer(terrainId, dateReservation, heureDebut)
      .subscribe({
        next: (t) => {
          this.tarifInfo = t;

          if (heureFin && heureDebut) {
            const [h1, m1] = heureDebut.split(':').map(Number);
            const [h2, m2] = heureFin.split(':').map(Number);
            const minutes  = (h2 * 60 + m2) - (h1 * 60 + m1);
            this.montantEstime = minutes > 0
              ? Math.round((minutes / 60) * t.tarifFinal * 100) / 100
              : 0;
          }

          this.tarifSvc.getMeilleursCreneaux(terrainId, dateReservation)
            .subscribe({
              next: (s) => {
                this.suggestions = (s.meilleursCreneaux || [])
                  .filter((c: any) =>
                    c.heure !== heureDebut &&
                    c.tarifFinal < t.tarifFinal
                  )
                  .slice(0, 3);
                this.loadingTarif = false;
              },
              error: () => this.loadingTarif = false
            });
        },
        error: () => {
          this.tarifInfo    = null;
          this.loadingTarif = false;
        }
      });
  }

  appliquerSuggestion(heure: string) {
    this.reservation.heureDebut = heure;
    this.updateTarif();
  }

  getNiveauIcon(niveau: string): string {
    const m: any = {
      TRES_ELEVE: '🔥', ELEVE: '📈',
      NORMAL: '➡️', STANDARD: '✅', PROMO: '🎁'
    };
    return m[niveau] || '➡️';
  }

  getNiveauLabel(niveau: string): string {
    const m: any = {
      TRES_ELEVE: 'Très élevé', ELEVE: 'Élevé',
      NORMAL: 'Normal', STANDARD: 'Standard', PROMO: 'Promotion 🎁'
    };
    return m[niveau] || niveau;
  }

  submit() {
    this.loading = true;
    this.erreur  = '';
    this.svc.create(this.reservation).subscribe({
      next: () => this.router.navigate(['/reservations']),
      error: (e: any) => {
        this.erreur  = e.error?.erreur || '⛔ Créneau déjà réservé !';
        this.loading = false;
      }
    });
  }
}