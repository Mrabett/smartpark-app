import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {
  ReservationService,
  Reservation
} from '../../../services/reservation.service';

@Component({
  selector: 'app-user-mes-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass],
  templateUrl: './user-mes-reservations.component.html',
  styleUrl: './user-mes-reservations.component.scss'
})
export class UserMesReservationsComponent implements OnInit {

  reservations: Reservation[]        = [];
  reservationsFiltrees: Reservation[] = [];
  filtreActif  = 'TOUS';
  message      = '';
  messageType  = 'success';
  loading      = true;
  erreur       = '';

  filtres = [
    { label: '🔵 Toutes',     value: 'TOUS'       },
    { label: '✅ Confirmées', value: 'CONFIRMEE'  },
    { label: '⏳ En attente', value: 'EN_ATTENTE' },
    { label: '❌ Annulées',   value: 'ANNULEE'    }
  ];

  constructor(
    private svc: ReservationService,
    private router: Router
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.erreur  = '';

    // ✅ getMesReservations() filtre par email JWT côté backend
    this.svc.getMesReservations().subscribe({
      next: (data) => {
        this.reservations = data.sort((a, b) =>
          new Date(b.dateReservation).getTime() -
          new Date(a.dateReservation).getTime()
        );
        this.filtrer(this.filtreActif);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.erreur = 'Session expirée — reconnectez-vous';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.erreur = 'Erreur de chargement des réservations';
        }
      }
    });
  }

  filtrer(statut: string) {
    this.filtreActif = statut;
    this.reservationsFiltrees = statut === 'TOUS'
      ? this.reservations
      : this.reservations.filter(r => r.statut === statut);
  }

  annuler(id: string) {
    if (!confirm('Voulez-vous annuler cette réservation ?')) return;

    this.svc.annuler(id).subscribe({
      next: () => {
        this.message     = '✅ Réservation annulée avec succès !';
        this.messageType = 'success';
        this.load();
        setTimeout(() => this.message = '', 3000);
      },
      error: () => {
        this.message     = '⛔ Impossible d\'annuler cette réservation';
        this.messageType = 'error';
      }
    });
  }

  delete(id: string) {
    if (!confirm('Supprimer définitivement ?')) return;

    this.svc.delete(id).subscribe({
      next: () => {
        this.message     = '🗑️ Réservation supprimée !';
        this.messageType = 'success';
        this.load();
        setTimeout(() => this.message = '', 3000);
      },
      error: () => {
        this.message     = '⛔ Impossible de supprimer';
        this.messageType = 'error';
      }
    });
  }

  getBadgeClass(statut?: string): string {
    if (statut === 'CONFIRMEE') return 'badge-green';
    if (statut === 'ANNULEE')   return 'badge-red';
    return 'badge-amber';
  }

  getInitials(nom: string): string {
    return nom
      ? nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : '?';
  }

  getCount(statut: string): number {
    if (statut === 'TOUS') return this.reservations.length;
    return this.reservations.filter(r => r.statut === statut).length;
  }

  getTotalDepense(): number {
    return Math.round(
      this.reservations
        .filter(r => r.statut === 'CONFIRMEE')
        .reduce((s, r) => s + (r.montantTotal || 0), 0)
    );
  }
}