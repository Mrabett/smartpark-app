import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SpotService } from '../../../../../services/spot.service';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { Spot } from '../../../models/spot.model';
import { ParkingReservation } from '../../../models/reservation.model';

@Component({
  selector: 'app-select-spot-dialog',
  templateUrl: './select-spot-dialog.component.html',
  styleUrl: './select-spot-dialog.component.css',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule
  ],
})
export class SelectSpotDialogComponent implements OnInit {
  spots: Spot[] = [];
  reservations: ParkingReservation[] = [];

  private spotService = inject(SpotService);
  private reservationService = inject(ParkingReservationService);

  constructor(
    public dialogRef: MatDialogRef<SelectSpotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { parkingId: string, matricule: string }
  ) { }

  ngOnInit(): void {
    this.loadSpots();
    this.loadReservations();
  }

  loadSpots(): void {
    if (this.data.parkingId) {
      this.spotService.getSpotsByParking(this.data.parkingId).subscribe({
        next: (data) => {
          this.spots = data.map((spot, index) => ({
            ...spot,
            x: spot.x !== undefined ? spot.x : (index % 10) * 80 + 40,
            y: spot.y !== undefined ? spot.y : Math.floor(index / 10) * 80 + 40
          }));
        },
        error: (err) => console.error('Erreur chargement places:', err)
      });
    }
  }

  loadReservations(): void {
    if (this.data.parkingId) {
      this.reservationService.getReservationsByParking(this.data.parkingId).subscribe({
        next: (res) => {
          // Filtrer seulement les réservations valides/en cours/en attente
          this.reservations = res.filter(r => !r.isDeleted && r.statusAction !== 'SORTIE_VALIDEE' && r.statusAction !== 'TERMINEE');
        },
        error: (err) => console.error('Erreur chargement réservations:', err)
      });
    }
  }

  getSpotReservations(spotId: string): ParkingReservation[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.reservations.filter(r => {
      if(r.spotId !== spotId) return false;
      if(!r.datetimeEntree) return false;
      const resDate = new Date(r.datetimeEntree);
      return resDate >= today;
    });
  }

  getSpotTooltip(spot: Spot): string {
    const res = this.getSpotReservations(spot.id!);
    if (res.length === 0) {
      if (spot.statut === 'OCCUPE') return 'Place actuellement occupée (Sans ticket lié)';
      if (spot.statut === 'MAINTENANCE') return 'En maintenance';
      return 'Disponible toute la journée';
    }
    
    let tooltip = `Créneaux indisponibles :\n`;
    res.forEach(r => {
      if (r.datetimeEntree && r.datetimeSortie) {
        const d1 = formatDate(r.datetimeEntree, 'HH:mm', 'en-US');
        const d2 = formatDate(r.datetimeSortie, 'HH:mm', 'en-US');
        const statusMsg = r.statusAction === 'ENTREE_VALIDEE' ? ' (En cours)' : '';
        tooltip += `- De ${d1} à ${d2}${statusMsg}\n`;
      } else {
        tooltip += `- Ticket sans heure de fin exacte\n`;
      }
    });
    return tooltip;
  }

  isSpotDynamicallyOccupied(spot: Spot): boolean {
    const res = this.getSpotReservations(spot.id!);
    const now = new Date();
    return res.some(r => {
      if (!r.datetimeSortie) return true; // Spontané sans fin
      const rEnd = new Date(r.datetimeSortie);
      const rStart = new Date(r.datetimeEntree!);
      return now >= rStart && now <= rEnd;
    });
  }

  getSpotClass(spot: Spot): string {
    if (spot.statut === 'MAINTENANCE') return 'disabled statut-MAINTENANCE';
    if (spot.statut === 'OCCUPE' || this.isSpotDynamicallyOccupied(spot)) return 'disabled statut-OCCUPE';
    if (this.getSpotReservations(spot.id!).length > 0) return 'statut-RESERVE';
    return 'statut-' + spot.statut;
  }

  getSpotIcon(spot: Spot): string {
    if (spot.statut === 'OCCUPE' || this.isSpotDynamicallyOccupied(spot)) return 'directions_car';
    if (spot.statut === 'MAINTENANCE') return 'build';
    if (this.getSpotReservations(spot.id!).length > 0) return 'event_seat';
    return 'location_on';
  }

  selectSpot(spot: Spot): void {
    if (spot.statut === 'MAINTENANCE' || spot.statut === 'OCCUPE' || this.isSpotDynamicallyOccupied(spot)) {
      alert("Erreur : Cette place est actuellement occupée par un autre véhicule !");
      return; 
    }
    // On permet quand même de forcer si "LIBRE" mais réservé pour plus tard
    this.dialogRef.close(spot.id);
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
