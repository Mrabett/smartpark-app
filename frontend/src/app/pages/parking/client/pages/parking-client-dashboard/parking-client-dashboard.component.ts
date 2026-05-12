import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// 🟢 NOUVEAUX IMPORTS POUR LE FILTRE
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

// Importation des composants version CLIENT (Assure-toi que les chemins sont corrects)
import { ParkingLotService } from '../../../../../services/parking-lot.service';
import { Parking } from '../../../models/parking.model';
import { SpotClientDialogComponent } from '../../components/spot-client-dialog/spot-client-dialog.component';
import { ListClientReservationsComponent } from '../../components/list-client-reservations/list-client-reservations.component';
import { ListReservationsComponent } from '../../../admin/components/list-reservations/list-reservations.component';

@Component({
  selector: 'app-parking-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    // 🟢 AJOUT DES MODULES ICI
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    ListClientReservationsComponent
  ],
  templateUrl: './parking-client-dashboard.component.html',
  styleUrls: ['./parking-client-dashboard.component.css']
})
export class ParkingClientDashboardComponent implements OnInit {
  parkings: Parking[] = [];
  filteredParkings: Parking[] = []; // 🟢 Liste qui sera affichée dans le tableau

  // 🟢 Variables pour le filtre
  selectedType: string = '';
  parkingTypes: string[] = []; // Liste des types générée dynamiquement

  // Colonnes simplifiées pour le client (on cache les IDs techniques et les dates système)
  displayedColumns: string[] = [
    'nom',
    'description',
    'typeParking',
    'prixInitial',
    'prixPromos',
    'spotsCount',
    'actions'
  ];

  private ParkingLotService = inject(ParkingLotService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.ParkingLotService.getAllParkings().subscribe({
      next: (data) => {
        this.parkings = data;
        this.filteredParkings = data; // Initialisation de la liste affichée
        this.extractParkingTypes();   // On génère la liste des types pour le combobox
      },
      error: (err) => console.error('Erreur chargement client:', err)
    });
  }

  // 🟢 Extraire dynamiquement les types uniques depuis les données
  extractParkingTypes(): void {
    const types = this.parkings.map(p => p.typeParking).filter(t => !!t);
    this.parkingTypes = [...new Set(types)]; // Retire les doublons
  }

  // 🟢 Fonction qui applique le filtre
  applyFilter(): void {
    if (!this.selectedType) {
      // Si aucun type n'est sélectionné, on affiche tout
      this.filteredParkings = this.parkings;
    } else {
      // Sinon, on filtre par le type choisi
      this.filteredParkings = this.parkings.filter(parking => parking.typeParking === this.selectedType);
    }
  }

  // Le client peut voir les places disponibles
  openSpotManager(parking: Parking): void {
    this.dialog.open(SpotClientDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: parking
    });
  }

  // Le client peut voir SES réservations pour ce parking
  viewReservations(parking: any): void {
    console.log('Consultation des réservations pour :', parking.nom);

    this.dialog.open(ListClientReservationsComponent, {
      width: '800px',
      data: parking
    });
  }
}