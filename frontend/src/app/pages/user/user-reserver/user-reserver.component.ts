import { Component, OnInit } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReservationService, Reservation } from '../../../services/reservation.service';
import { TerrainService, Terrain } from '../../../services/terrain.service';
import { TarifDynamiqueService } from '../../../services/tarif-dynamique.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-user-reserver',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, KeyValuePipe],
  templateUrl: './user-reserver.component.html',
  styleUrl: './user-reserver.component.scss'
})
export class UserReserverComponent implements OnInit {

  terrain: Terrain | null = null;
  erreur       = '';
  succes       = false;
  loading      = false;
  loadingTarif = false;

  // Tarification dynamique
  tarifInfo: any     = null;
  suggestions: any[] = [];
  montantEstime      = 0;

  reservation: Reservation = {
    terrainId: '', clientNom: '',
    clientEmail: '', clientTel: '',
    dateReservation: '', heureDebut: '', heureFin: ''
  };

  constructor(
    private svc: ReservationService,
    private terrainSvc: TerrainService,
    private tarifSvc: TarifDynamiqueService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.reservation.terrainId   = id;
    this.reservation.dateReservation =
      new Date().toISOString().split('T')[0];

    this.terrainSvc.getById(id).subscribe(t => {
      this.terrain = t;
    });

    const currentUser = this.authService.getUser();
    if (currentUser?.email) {
      this.reservation.clientEmail = currentUser.email;
    }
    if (currentUser?.nom) {
      this.reservation.clientNom = currentUser.nom;
    }
  }

  // ✅ Mise à jour tarif en temps réel
  updateTarif() {
    const { terrainId, dateReservation, heureDebut, heureFin } =
      this.reservation;

    if (!terrainId || !dateReservation || !heureDebut) {
      this.tarifInfo     = null;
      this.montantEstime = 0;
      return;
    }

    this.loadingTarif = true;

    this.tarifSvc.calculer(terrainId, dateReservation, heureDebut)
      .subscribe({
        next: (t) => {
          this.tarifInfo = t;

          // Calcul montant estimé avec tarif dynamique
          if (heureFin && heureDebut) {
            const [h1, m1] = heureDebut.split(':').map(Number);
            const [h2, m2] = heureFin.split(':').map(Number);
            const minutes  = (h2 * 60 + m2) - (h1 * 60 + m1);
            this.montantEstime = minutes > 0
              ? Math.round((minutes / 60) * t.tarifFinal * 100) / 100
              : 0;
          }

          // Suggestions créneaux moins chers
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

  getIcon(type: string): string {
    const icons: any = {
      FOOT: '⚽', PADEL: '🏓',
      TENNIS: '🎾', BASKETBALL: '🏀', VOLLEYBALL: '🏐'
    };
    return icons[type] || '🏟️';
  }

  getBgClass(type: string): string {
    const c: any = {
      FOOT: 'bg-foot', PADEL: 'bg-padel',
      TENNIS: 'bg-tennis', BASKETBALL: 'bg-basket'
    };
    return c[type] || 'bg-foot';
  }

  submit() {
    this.erreur  = '';
    this.loading = true;

    // ✅ Envoyer le montant dynamique calculé
    const reservationData: any = {
      ...this.reservation,
      montantTotal: this.montantEstime > 0
        ? this.montantEstime : undefined
    };

    this.svc.create(reservationData).subscribe({
      next: () => {
        this.loading = false;
        this.succes  = true;
        setTimeout(() => {
          this.router.navigate(['/user/reservations']);
        }, 2000);
      },
      error: (e: any) => {
        this.loading = false;
        this.erreur  = e.error?.erreur || '⛔ Créneau déjà réservé !';
      }
    });
  }
}