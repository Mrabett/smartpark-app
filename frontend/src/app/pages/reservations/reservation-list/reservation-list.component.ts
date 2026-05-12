import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationService, Reservation } from '../../../services/reservation.service';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.scss'
})
export class ReservationListComponent implements OnInit {
  reservations: Reservation[] = [];
  reservationsFiltrees: Reservation[] = [];
  filtreActif = 'TOUS';
  message = '';

  filtres = [
    { label: '🔵 Toutes',      value: 'TOUS'       },
    { label: '✅ Confirmées',  value: 'CONFIRMEE'  },
    { label: '⏳ En attente',  value: 'EN_ATTENTE' },
    { label: '❌ Annulées',    value: 'ANNULEE'    }
  ];

  constructor(private svc: ReservationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.svc.getAll().subscribe({
      next: (data) => {
        this.reservations = data;
        this.filtrer(this.filtreActif);
      }
    });
  }

  filtrer(statut: string) {
    this.filtreActif = statut;
    this.reservationsFiltrees = statut === 'TOUS'
      ? this.reservations
      : this.reservations.filter(r => r.statut === statut);
  }

  // ADMIN confirme une réservation EN_ATTENTE
  confirmer(id: string) {
    // On utilise l'endpoint annuler mais on met CONFIRMEE
    // Il faut ajouter un endpoint confirmer dans Spring Boot
    // Pour l'instant on update via le service
    const res = this.reservations.find(r => r.id === id);
    if (res) {
      this.svc.confirmer(id).subscribe({
        next: () => {
          this.message = '✅ Réservation confirmée !';
          this.load();
          setTimeout(() => this.message = '', 3000);
        }
      });
    }
  }

  annuler(id: string) {
    if (confirm('Annuler cette réservation ?')) {
      this.svc.annuler(id).subscribe({
        next: () => {
          this.message = '✅ Réservation annulée !';
          this.load();
          setTimeout(() => this.message = '', 3000);
        }
      });
    }
  }

  delete(id: string) {
    if (confirm('Supprimer définitivement cette réservation ?')) {
      this.svc.delete(id).subscribe({
        next: () => {
          this.message = '🗑️ Réservation supprimée !';
          this.load();
          setTimeout(() => this.message = '', 3000);
        }
      });
    }
  }

  getCount(statut: string): number {
    return this.reservations.filter(r => r.statut === statut).length;
  }

  getBadgeClass(statut?: string): string {
    if (statut === 'CONFIRMEE')  return 'badge-green';
    if (statut === 'ANNULEE')    return 'badge-red';
    return 'badge-amber';
  }

  getInitials(nom: string): string {
    return nom
      ? nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : '?';
  }

  getTotalRevenus(): number {
    return this.reservations
      .filter(r => r.statut === 'CONFIRMEE')
      .reduce((s, r) => s + (r.montantTotal || 0), 0);
  }
}