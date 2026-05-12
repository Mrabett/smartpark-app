import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Parking, TypeParking } from '../../../models/parking.model';
import { MatDatepickerModule } from '@angular/material/datepicker'; 
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core'; 
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-edit-client-parking-dialog', // 👈 Nom unique
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule,
    MatSlideToggleModule,
    MatDatepickerModule, 
    MatNativeDateModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()], 
  templateUrl: './edit-client-parking-dialog.component.html',
  styleUrls: ['./edit-client-parking-dialog.component.css']
})
export class EditClientParkingDialogComponent implements OnInit {
  parkingForm!: FormGroup;
  typeOptions = Object.values(TypeParking);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditClientParkingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Parking | null 
  ) {}

  ngOnInit(): void {
    // Conversion des dates pour l'affichage
    const parsedDateDebut = this.data?.dateDebutPromos ? new Date(this.data.dateDebutPromos) : null;
    const parsedDateFin = this.data?.dateFinPromos ? new Date(this.data.dateFinPromos) : null;

    this.parkingForm = this.fb.group({
      nom: [{ value: this.data?.nom || '', disabled: true }], // 'disabled: true' car le client ne modifie pas
      description: [{ value: this.data?.description || '', disabled: true }],
      typeParking: [{ value: this.data?.typeParking || TypeParking.VOITURE, disabled: true }],
      prixInitial: [{ value: this.data?.prixInitial || 0, disabled: true }],
      prixPromos: [{ value: this.data?.prixPromos || 0, disabled: true }],
      isEvent: [{ value: this.data?.isEvent || false, disabled: true }],
      dateDebutPromos: [{ value: parsedDateDebut, disabled: true }],
      dateFinPromos: [{ value: parsedDateFin, disabled: true }]
    });
  }

  // Le bouton "Save" devient inutile pour un client, mais on garde une action de fermeture
  confirm(): void {
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}