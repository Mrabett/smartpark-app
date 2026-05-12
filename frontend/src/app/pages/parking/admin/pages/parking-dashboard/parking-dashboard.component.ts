import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule, Router } from '@angular/router';

import { DetectionPopupComponent } from '../../components/DetectionPopoup/detection-popup.component';
import { ListReservationsComponent } from '../../components/list-reservations/list-reservations.component';
import { ParkingLotService } from '../../../../../services/parking-lot.service';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { Parking } from '../../../models/parking.model';
import { ParkingReservation } from '../../../models/reservation.model';
import { EditParkingDialogComponent } from '../../components/edit-parking-dialog/edit-parking-dialog.component';
import { SpotDialogComponent } from '../../components/spot-dialog/spot-dialog.component';
import { RemiseAdminDialogComponent } from '../../components/remise-admin-dialog/remise-admin-dialog.component';

// ✅ Import du service de contexte du parking
import { ParkingContextService } from '../../../../../services/parking-context.service';

@Component({
  selector: 'app-parking-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ListReservationsComponent,
    ZXingScannerModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    RouterModule,
    DetectionPopupComponent
  ],
  templateUrl: './parking-dashboard.component.html',
  styleUrls: ['./parking-dashboard.component.css']
})
export class ParkingDashboardComponent implements OnInit {
  private router = inject(Router);
  parkings: Parking[] = [];
  filteredParkings: Parking[] = [];
  searchTerm: string = '';
  selectedType: string = '';
  parkingTypes: string[] = [];

  // ✅ VARIABLE AJOUTÉE POUR LE LIEU DE TRAVAIL
  parkingSelectionne: string | null = null;

  // Scanner
  isCameraOpen: boolean = false;
  ticketData: any = null;
  isLoadingTicket: boolean = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined = undefined;
  hasDevices: boolean = false;

  // Calculs & États
  etatTicket: 'A_ENTRER' | 'A_SORTIR' | 'TERMINE' = 'A_ENTRER';
  fraisDepassement: number = 0;
  remiseRetard: number = 0;
  montantTotalFinal: number = 0;
  retardMinutes: number = 0;
  alerteIncoherence: boolean = false;

  displayedColumns: string[] = ['nom', 'typeParking', 'prixInitial', 'prixPromos', 'spotsCount', 'actions'];

  // Injections
  private ParkingLotService = inject(ParkingLotService);
  private ParkingReservationService = inject(ParkingReservationService);
  private parkingContext = inject(ParkingContextService); // ✅ Injection du nouveau service
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    // ✅ Initialisation du parking actif depuis le localStorage
    this.parkingSelectionne = this.parkingContext.getCurrentParkingId();
    this.loadData();
  }

  // ✅ MÉTHODE AJOUTÉE POUR GÉRER LE CHANGEMENT DE PARKING
  onParkingChange(nouveauParkingId: string): void {
    this.parkingSelectionne = nouveauParkingId;
    this.parkingContext.setActiveParking(nouveauParkingId);
    this.snackBar.open('📍 Lieu de travail mis à jour !', 'Fermer', { duration: 3000 });
  }

  loadData(): void {
    this.ParkingLotService.getAllParkings().subscribe({
      next: (data) => {
        this.parkings = data;
        this.filteredParkings = data;
        this.extractParkingTypes();
      }
    });
  }

  private fixDate(dateInput: any): Date {
    if (!dateInput) return new Date();
    if (typeof dateInput === 'string') return new Date(dateInput.replace(' ', 'T'));
    return new Date(dateInput);
  }

  extractParkingTypes(): void {
    const types = this.parkings.map(p => p.typeParking).filter(t => !!t);
    this.parkingTypes = [...new Set(types)];
  }

  applyFilters(): void {
    this.filteredParkings = this.parkings.filter(p =>
      (p.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (this.selectedType ? p.typeParking === this.selectedType : true)
    );
  }

  toggleCamera(): void {
    this.isCameraOpen = !this.isCameraOpen;
    if (this.isCameraOpen) {
      this.ticketData = null;
      this.alerteIncoherence = false;
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = devices?.length > 0;
    if (this.hasDevices) this.currentDevice = devices[0];
  }

  onDeviceChange(device: MediaDeviceInfo): void { this.currentDevice = device; }

  onTicketScanned(result: string): void {
    this.isCameraOpen = false;
    this.alerteIncoherence = false;

    // Extraire l'ID du résultat QR Code
    let id = result;
    if (result.includes('/ticket-client/')) {
        id = result.split('/ticket-client/')[1];
    } else if (result.includes('/ticket/')) {
        id = result.split('/ticket/')[1];
    }

    // Rediriger directement vers la vue détaillée grise de l'Admin
    if (id) {
        this.router.navigate(['/ticket', id]);
    } else {
        this.snackBar.open('❌ Erreur : Code QR invalide.', 'Fermer', { duration: 5000 });
    }
  }

  analyserTicket(data: ParkingReservation): void {
    const maintenant = new Date();
    const entreeP = this.fixDate(data.datetimeEntree);
    const sortieP = this.fixDate(data.datetimeSortie);

    if (!data.statusAction || data.statusAction === 'ATTENTE' || data.statusAction === 'EN_ATTENTE') {
      this.etatTicket = 'A_ENTRER';
    } else if (data.statusAction === 'ENTREE' || data.statusAction === 'ENTREE_VALIDEE') {
      this.etatTicket = 'A_SORTIR';
    } else {
      this.etatTicket = 'TERMINE';
    }

    this.fraisDepassement = 0;
    this.remiseRetard = 0;
    this.retardMinutes = 0;

    if (data.spontane || data.statusAction === 'EN_COURS') {
      if (this.etatTicket === 'A_SORTIR') {
        const tempsEcouleMs = maintenant.getTime() - entreeP.getTime();
        const heuresEcoulees = Math.max(1, Math.ceil(tempsEcouleMs / 3600000));
        const tarifHoraire = (data.tarifDepassement && data.tarifDepassement > 0) ? data.tarifDepassement : 5;
        this.montantTotalFinal = heuresEcoulees * tarifHoraire;
      } else {
        this.montantTotalFinal = data?.montantFinal ?? 0;
      }
    } else {
      if (this.etatTicket === 'A_ENTRER') {
        if (maintenant > entreeP) {
          this.retardMinutes = Math.floor((maintenant.getTime() - entreeP.getTime()) / 60000);
          const diffH = Math.floor(this.retardMinutes / 60);
          if (diffH >= 1) this.remiseRetard = diffH * (data.remiseRetard || 0);
        }
      } else if (this.etatTicket === 'A_SORTIR') {
        if (maintenant > sortieP) {
          this.retardMinutes = Math.floor((maintenant.getTime() - sortieP.getTime()) / 60000);
          const diffH = Math.ceil(this.retardMinutes / 60); // Facturation de toute heure entamée (comme l'Admin Ticket)
          if (diffH >= 1) this.fraisDepassement = diffH * (data.tarifDepassement || 0);
        }
      }

      const montantDeBase = (data?.montantFinal ?? data?.montant) ?? 0;
      this.montantTotalFinal = montantDeBase + this.fraisDepassement - this.remiseRetard;
      if (this.montantTotalFinal < 0) this.montantTotalFinal = 0;
    }

    const couleurDetecteeSortie = "Rouge";
    if (this.etatTicket === 'A_SORTIR' && data.voitureCouleur) {
      if (data.voitureCouleur.toLowerCase() !== couleurDetecteeSortie.toLowerCase()) {
        this.alerteIncoherence = true;
      }
    }
  }

  validerTicket(): void {
    if (!this.ticketData || this.etatTicket === 'TERMINE') return;

    const statut = this.etatTicket === 'A_ENTRER' ? 'ENTREE_VALIDEE' : 'SORTIE_VALIDEE';

    this.ParkingReservationService.validerFlux(this.ticketData.id, {
      statusAction: statut,
      montantFinal: this.montantTotalFinal
    }).subscribe({
      next: () => {
        this.snackBar.open('✅ Flux validé avec succès !', 'Fermer', { duration: 3000 });
        this.fermerTicket();
        this.loadData();
      }
    });
  }

  fermerTicket(): void {
    this.ticketData = null;
    this.alerteIncoherence = false;
  }

  openAdd(): void {
    this.dialog.open(EditParkingDialogComponent, { width: '550px', data: null }).afterClosed().subscribe(res => {
      if (res) this.ParkingLotService.createParking(res).subscribe(() => this.loadData());
    });
  }

  openEdit(parking: Parking) {
    this.dialog.open(EditParkingDialogComponent, { width: '550px', data: parking }).afterClosed().subscribe(res => {
      if (res && parking.id) this.ParkingLotService.updateParking(parking.id, { ...parking, ...res }).subscribe(() => this.loadData());
    });
  }

  deleteParking(id: string): void {
    if (confirm('Supprimer ce parking ?')) this.ParkingLotService.deleteParking(id).subscribe(() => this.loadData());
  }

  openSpotManager(p: Parking): void {
    this.dialog.open(SpotDialogComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      panelClass: 'no-padding-dialog',
      data: p
    });
  }

  viewReservations(p: any): void { this.dialog.open(ListReservationsComponent, { width: '800px', data: p }); }

  openRemiseDialog(p: Parking): void {
    this.dialog.open(RemiseAdminDialogComponent, { width: '800px', data: p }).afterClosed().subscribe(() => this.loadData());
  }
}