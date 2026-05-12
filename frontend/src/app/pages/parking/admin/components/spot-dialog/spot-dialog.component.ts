import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';

import { SpotService } from '../../../../../services/spot.service';
import { Spot } from '../../../models/spot.model';
import { Parking } from '../../../models/parking.model';
import { ReservationDialogComponent } from '../reservation-dialog/reservation-dialog.component';

@Component({
  selector: 'app-spot-dialog',
  templateUrl: './spot-dialog.component.html',
  styleUrl: './spot-dialog.component.css',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatDividerModule,
    DragDropModule
  ],
})
export class SpotDialogComponent implements OnInit {
  spots: Spot[] = [];
  spotForm!: FormGroup;
  editingSpotId: string | null = null;

  private spotService = inject(SpotService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);

  constructor(
    public dialogRef: MatDialogRef<SpotDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parking: Parking
  ) { }

  ngOnInit(): void {
    this.spotForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      statut: ['LIBRE']
    });
    this.loadSpots();
  }

  loadSpots(): void {
    if (this.parking.id) {
      this.spotService.getSpotsByParking(this.parking.id).subscribe({
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

  addSpot(): void {
    if (this.spotForm.valid && this.parking.id) {
      const val = this.spotForm.value;
      const spotData: any = {
        nom: val.nom,
        description: val.description,
        statut: val.statut,
        parking: { id: this.parking.id },
        x: 400,
        y: 300
      };

      if (this.editingSpotId) {
        this.spotService.updateSpot(this.editingSpotId, spotData).subscribe({
          next: () => { this.loadSpots(); this.resetForm(); },
          error: (err) => console.error('Erreur modification:', err)
        });
      } else {
        this.spotService.createSpot(spotData).subscribe({
          next: () => { this.loadSpots(); this.resetForm(); },
          error: (err) => console.error('Erreur création:', err)
        });
      }
    }
  }

  resetForm(): void {
    this.spotForm.reset({ statut: 'LIBRE', nom: '', description: '' });
    this.editingSpotId = null;
  }

  editSpot(spot: Spot): void {
    this.editingSpotId = spot.id!;
    this.spotForm.patchValue({
      nom: spot.nom,
      description: spot.description,
      statut: spot.statut
    });
  }

  deleteSpot(id: string): void {
    if (confirm('Voulez-vous vraiment supprimer ce spot ?')) {
      this.spotService.deleteSpot(id).subscribe({
        next: () => this.loadSpots(),
        error: (err) => console.error('Erreur suppression:', err)
      });
    }
  }

  updateStatus(spot: Spot, newStatus: string): void {
    const spotUpdate = { ...spot, statut: newStatus };
    this.spotService.updateSpot(spot.id!, spotUpdate).subscribe({
      next: () => this.loadSpots(),
      error: (err) => console.error("Erreur statut", err)
    });
  }

  onDragEnded(event: CdkDragEnd, spot: Spot): void {
    const element = event.source.getRootElement();
    const container = element.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const centerX = (elementRect.left - containerRect.left) + (elementRect.width / 2);
      const centerY = (elementRect.top - containerRect.top) + (elementRect.height / 2);

      spot.x = Math.round((centerX / containerRect.width) * 800);
      spot.y = Math.round((centerY / containerRect.height) * 600);

      this.spotService.updateSpot(spot.id!, spot).subscribe();
    }
  }

  openReservation(spot: Spot): void {
    const dialogRef = this.dialog.open(ReservationDialogComponent, {
      width: '400px',
      data: { ...spot, parking: this.parking }
    });
    dialogRef.afterClosed().subscribe(success => { if (success) this.loadSpots(); });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file && this.parking?.id) {
      const formData = new FormData();
      formData.append("file", file);
      this.http.post(`${environment.apiBaseUrl}/parkings/${this.parking.id}/upload-layout`, formData).subscribe({
        next: () => { alert("L'outil IA va s'ouvrir..."); setTimeout(() => this.loadSpots(), 5000); },
        error: (err) => console.error("Erreur IA", err)
      });
    }
  }

  close(): void { this.dialogRef.close(); }
}