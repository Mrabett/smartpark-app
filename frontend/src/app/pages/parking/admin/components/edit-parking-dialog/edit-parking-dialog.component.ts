import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Parking, TypeParking } from '../../../models/parking.model';
import { ErrorStateMatcher } from '@angular/material/core';
import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidParent = !!(form && form.hasError('dateRangeInvalid'));
    return invalidParent;
  }
}
@Component({
  selector: 'app-parking-dialog',
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
  // 🚀 C'EST ICI LA CLÉ : Fournir l'adaptateur de date au calendrier
  providers: [provideNativeDateAdapter()],

  templateUrl: './edit-parking-dialog.component.html',
  styleUrls: ['./edit-parking-dialog.component.css']
})
export class EditParkingDialogComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  parkingForm!: FormGroup;
  today = new Date();
  minDate: Date = new Date();
  // Récupération des valeurs de l'Enum pour le select
  typeOptions = Object.values(TypeParking);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditParkingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Parking | null // null si Ajout, objet si Edit
  ) { }

  ngOnInit(): void {
    // 1. On convertit les chaînes de caractères reçues du backend en vraies Dates JS
    const parsedDateDebut = this.data?.dateDebutPromos ? new Date(this.data.dateDebutPromos) : null;
    const parsedDateFin = this.data?.dateFinPromos ? new Date(this.data.dateFinPromos) : null;

    // 2. On initialise le formulaire avec les dates converties
    this.parkingForm = this.fb.group({
      nom: [this.data?.nom || '', Validators.required],
      description: [this.data?.description || ''],
      typeParking: [this.data?.typeParking || TypeParking.VOITURE, Validators.required],
      prixInitial: [this.data?.prixInitial || 0, [Validators.required, Validators.min(0)]],
      prixPromos: [this.data?.prixPromos || 0, [Validators.min(0)]],
      isEvent: [this.data?.isEvent || false],
      isDeleted: [this.data?.isDeleted || false],
      dateDebutPromos: [parsedDateDebut],
      dateFinPromos: [parsedDateFin]
    }, {
      validators: this.dateRangeValidator
    });
    this.managePromoValidators(this.parkingForm.get('isEvent')?.value); // Etat initial

    this.parkingForm.get('isEvent')?.valueChanges.subscribe((isEventActive: boolean) => {
      this.managePromoValidators(isEventActive);
    });



  }

  private managePromoValidators(isActive: boolean): void {
    const promoFields = ['prixPromos', 'dateDebutPromos', 'dateFinPromos'];

    promoFields.forEach(fieldName => {
      const control = this.parkingForm.get(fieldName);
      if (isActive) {
        control?.setValidators([Validators.required, fieldName === 'prixPromos' ? Validators.min(0) : Validators.nullValidator]);
      } else {
        control?.clearValidators();
        // Optionnel : On peut aussi remettre à zéro les valeurs si on décoche l'event
        // control?.setValue(fieldName === 'prixPromos' ? 0 : null);
      }
      control?.updateValueAndValidity(); // 🔥 Crucial pour rafraîchir l'état du formulaire
    });
  }
  save(): void {
    if (this.parkingForm.valid) {
      const rawValue = this.parkingForm.getRawValue();

      // On formate les dates en YYYY-MM-DD pour que Spring Boot soit content
      const formattedData = {
        ...rawValue,
        dateDebutPromos: (rawValue.isEvent && rawValue.dateDebutPromos) ? new Date(rawValue.dateDebutPromos).toISOString().split('T')[0] : null,
        dateFinPromos: (rawValue.isEvent && rawValue.dateFinPromos) ? new Date(rawValue.dateFinPromos).toISOString().split('T')[0] : null,
        prixPromos: rawValue.isEvent ? rawValue.prixPromos : 0
      };

      this.dialogRef.close(formattedData);
    }
  }


  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('dateDebutPromos')?.value;
    const end = group.get('dateFinPromos')?.value;
    if (start && end && new Date(start) > new Date(end)) {
      return { dateRangeInvalid: true };
    }
    return null;
  }

  close(): void {
    this.dialogRef.close();
  }
}