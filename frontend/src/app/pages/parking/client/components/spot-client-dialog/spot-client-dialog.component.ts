import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SpotService } from '../../../../../services/spot.service'; // Assumer une version commune ou cliente
import { Spot } from '../../../models/spot.model';
import { Parking } from '../../../models/parking.model';
import { ReservationClientDialogComponent } from '../reservation-client-dialog/reservation-client-dialog.component';

@Component({
  selector: 'app-spot-client-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTooltipModule,
    MatButtonModule, MatIconModule
  ],
  providers: [
    // providesadapter pour mat-dialog si non chargé globalement
  ],
  templateUrl: './spot-client-dialog.component.html',
  styleUrl: './spot-client-dialog.component.css'
})
export class SpotClientDialogComponent implements OnInit {
  spots: Spot[] = [];
  isLoading = true;

  private spotService = inject(SpotService);
  private dialog = inject(MatDialog);

  constructor(
    public dialogRef: MatDialogRef<SpotClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parking: Parking
  ) { }

  ngOnInit(): void {
    this.loadSpots();
  }

  loadSpots(): void {
    if (this.parking.id) {
      this.spotService.getSpotsByParking(this.parking.id).subscribe({
        next: (data) => {
          // 🟢 CORRECTION : On s'assure que x et y sont bien des nombres 
          // et on évite les doublons d'ID si le service renvoie des données brutes.
          this.spots = data.map((spot, index) => {
            let x = Number(spot.x) || 0;
            let y = Number(spot.y) || 0;

            // 🟢 CORRECTION : Même logique de fallback que dans l'admin
            if (!spot.x && !spot.y) {
              x = (index % 8) * 60 + 10;
              y = Math.floor(index / 8) * 60 + 10;
            }

            return {
              ...spot,
              x,
              y
            };
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Erreur chargement places client:', err);
          this.isLoading = false;
        }
      });
    }
  }

  // 🟢 AJOUT : trackBy pour éviter les bugs de rendu (l'effet "double" sur t15)
  trackBySpotId(index: number, spot: Spot): string | number {
    return spot.id || index;
  }

  getLibreCount(): number {
    return this.spots.filter(s => s.statut === 'LIBRE').length;
  }

  selectSpot(spot: Spot): void {
    if (spot.statut !== 'LIBRE') return;
    const dialogRef = this.dialog.open(ReservationClientDialogComponent, {
      width: '450px',
      data: { ...spot, parking: this.parking }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadSpots();
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  getSpotClass(spot: Spot): string {
    if (spot.statut === 'LIBRE') return 'statut-LIBRE';
    if (spot.statut === 'OCCUPE') return 'statut-OCCUPE disabled';
    if (spot.statut === 'EN MAINTENANCE') return 'statut-MAINTENANCE disabled';
    return 'statut-RESERVE disabled'; // RESERVÉ ou Indisponible
  }

  getSpotIcon(spot: Spot): string {
    if (spot.statut === 'LIBRE') return 'directions_car'; // ou check_circle
    if (spot.statut === 'OCCUPE') return 'directions_car';
    if (spot.statut === 'EN MAINTENANCE') return 'build';
    return 'lock';
  }

  getSpotTooltip(spot: Spot): string {
    if (spot.statut === 'LIBRE') return `Place ${spot.nom} — Libre`;
    return `Place ${spot.nom} — ${spot.statut}`;
  }
}