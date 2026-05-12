import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { MatDialog } from '@angular/material/dialog';
import { QRCodeModule } from 'angularx-qrcode';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReservationClientDialogComponent } from '../reservation-client-dialog/reservation-client-dialog.component';
import { AuthService } from '../../../../../services/auth.service';

@Component({
  selector: 'app-list-client-reservations',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    QRCodeModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './list-client-reservations.component.html',
  styleUrls: ['./list-client-reservations.component.css']
})
export class ListClientReservationsComponent implements OnInit {
  reservations: any[] = [];
  // ✅ Colonne 'status' incluse pour le design
  displayedColumns: string[] = ['matricule', 'dates', 'status', 'montant', 'qrCode', 'actions'];
  isLoading = true;

  private ParkingReservationService = inject(ParkingReservationService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    if (this.data && this.data.id) {
      this.loadReservations(this.data.id);
    } else {
      this.isLoading = false;
    }
  }

  loadReservations(parkingId: string): void {
    this.ParkingReservationService.getReservationsByParking(parkingId).subscribe({
      next: (res: any) => {
        let rawData = [];
        if (Array.isArray(res)) {
          rawData = res;
        } else if (res && res.content) {
          rawData = res.content;
        }

        const user = this.authService.getUser();

        // Filter out reservations that do not belong to the current user
        if (user?.email) {
          rawData = rawData.filter((r: any) => r.userId === user.email);
        }

        this.reservations = rawData.map((r: any) => ({
          ...r,
          displaySpot: r.spotNom || (r.spot?.nom) || (typeof r.spot === 'string' ? r.spot : null)
        }));

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }

  isFuture(dateStr: string): boolean {
    const maintenant = new Date();
    const dateEntree = new Date(dateStr);
    return dateEntree > maintenant;
  }

  editReservation(reservation: any): void {
    const dialogRef = this.dialog.open(ReservationClientDialogComponent, {
      width: '450px',
      data: reservation
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.loadReservations(this.data.id);
      }
    });
  }

  deleteReservation(id: string): void {
    const confirmation = confirm("Êtes-vous sûr de vouloir annuler cette réservation ?");
    if (confirmation) {
      this.isLoading = true;
      this.ParkingReservationService.deleteReservation(id).subscribe({
        next: () => {
          this.loadReservations(this.data.id);
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  genererQrCodeData(reservationId: string): string {
    const frontendIP = window.location.hostname;
    const frontendPort = window.location.port || '4200';
    return `http://${frontendIP}:${frontendPort}/ticket/${reservationId}`;
  }

  ouvrirTicket(id: string): void {
    const frontendIP = window.location.hostname;
    const frontendPort = window.location.port || '4200';
    // Pointe explicitement vers "ticket-client"
    window.open(`http://${frontendIP}:${frontendPort}/ticket-client/${id}`, '_blank');
  }
}