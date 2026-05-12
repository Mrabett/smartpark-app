import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { ReservationDialogComponent } from '../reservation-dialog/reservation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-list-reservations',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTableModule, MatIconModule, MatButtonModule,
    QRCodeModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule, MatProgressSpinnerModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
  ],
  templateUrl: './list-reservations.component.html',
  styleUrls: ['./list-reservations.component.css']
})
export class ListReservationsComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['image', 'client', 'dates', 'status', 'montant', 'qrCode', 'actions'];
  isLoading = true;

  filterValues = {
    text: '',
    date: null as Date | null
  };

  private ParkingReservationService = inject(ParkingReservationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef); // 👈 Ajouté pour forcer le rafraîchissement

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    if (this.data && this.data.id) {
      this.loadReservations(this.data.id);
    } else {
      this.isLoading = false;
    }
    // On initialise le filtre après le chargement
    this.setupFilterPredicate();
  }

  loadReservations(parkingId: string): void {
    this.isLoading = true;
    console.log("📡 Appel API pour parking ID:", parkingId);

    this.ParkingReservationService.getReservationsByParking(parkingId).subscribe({
      next: (res: any) => {
        const rawData = Array.isArray(res) ? res : (res?.content || []);
        console.log("📦 Données brutes reçues du serveur:", rawData);

        // Transformation sécurisée
        const mappedData = rawData.map((r: any) => {
          let clientNom = 'Client Spontané';
          if (r.userName) {
            clientNom = r.userName;
          } else if (r.user) {
            clientNom = `${r.user.firstname || ''} ${r.user.lastname || ''}`.trim() || 'Client Spontané';
          }

          return {
            ...r,
            displaySpot: r.spotNom || r.spot?.nom || 'Non assigné',
            displayUser: clientNom,
            displayMontant: r.montantFinal || r.montant || 0
          };
        });

        // 🟢 FIX 1 : On remplace la référence complète du tableau
        this.dataSource.data = [...mappedData];

        // 🟢 FIX 2 : On réinitialise le filtre pour être sûr que rien n'est masqué au départ
        this.applyFilter();

        this.isLoading = false;

        // 🟢 FIX 3 : On force Angular à vérifier la vue
        this.cdr.detectChanges();

        console.log("✅ Données prêtes pour affichage:", this.dataSource.data);
      },
      error: (err) => {
        console.error("❌ Erreur API :", err);
        this.isLoading = false;
      }
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: any, filterStr: string) => {
      // Si le filtre est vide, on affiche tout
      if (!filterStr || filterStr === '{"text":"","date":null}') return true;

      const searchTerms = JSON.parse(filterStr);
      const textSearch = (searchTerms.text || '').toLowerCase();

      const spotName = (data.displaySpot || '').toLowerCase();
      const matricule = (data.matricule || '').toLowerCase();
      const userName = (data.displayUser || '').toLowerCase();

      const matchText = matricule.includes(textSearch) ||
        spotName.includes(textSearch) ||
        userName.includes(textSearch);

      let matchDate = true;
      if (searchTerms.date) {
        const selectedDate = new Date(searchTerms.date).toDateString();
        const entreeDate = data.datetimeEntree ? new Date(data.datetimeEntree).toDateString() : null;
        matchDate = (entreeDate === selectedDate);
      }

      return matchText && matchDate;
    };
  }

  applyFilter() {
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  // ... reste de tes méthodes (edit, delete, etc.) sans changement
  editReservation(reservation: any): void {
    // On s'assure que le spotId est accessible pour le dialog de modification
    const spotId = reservation.spotId || reservation.spot?.id || reservation.parkingSpot?.id;
    const spotNom = reservation.spotNom || reservation.spot?.nom || reservation.parkingSpot?.nom;
    const spotParking = reservation.spot?.parking || reservation.parkingSpot?.parking;

    const dialogData = {
      ...reservation,
      // On force la présence de l'objet spot avec son ID pour le chargement des créneaux
      spot: { id: spotId, nom: spotNom, parking: spotParking }
    };

    this.dialog.open(ReservationDialogComponent, { width: '500px', data: dialogData })
      .afterClosed().subscribe(result => {
        if (result) this.loadReservations(this.data.id);
      });
  }

  deleteReservation(id: string): void {
    if (confirm('Annuler cette réservation ?')) {
      this.ParkingReservationService.cancelReservation(id).subscribe(() => {
        this.loadReservations(this.data.id);
      });
    }
  }

  generateDirectPdfLink(id: string): string {
    return `http://${window.location.hostname}:${window.location.port || '4200'}/ticket/${id}`;
  }

  ouvrirTicket(id: string): void {
    window.open(this.generateDirectPdfLink(id), '_blank');
  }
}