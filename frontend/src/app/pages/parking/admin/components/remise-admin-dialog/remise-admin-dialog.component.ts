import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';

import { RemiseService } from '../../../../../services/remise.service';
import { Remise } from '../../../models/remise.model';
import { ParkingLotService } from '../../../../../services/parking-lot.service';

@Component({
  selector: 'app-remise-admin-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatButtonModule,
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatTableModule, 
    MatDividerModule, 
    MatSelectModule
  ],
  templateUrl: './remise-admin-dialog.component.html',
  styleUrls: ['./remise-admin-dialog.component.css']
})
export class RemiseAdminDialogComponent implements OnInit {
  remiseForm!: FormGroup;
  parkingForm!: FormGroup;
  remises: Remise[] = [];

  // Colonnes du tableau des remises
  displayedColumns: string[] = ['seuil', 'pourcentage', 'description', 'theme', 'actions'];

  // ID de la remise en cours de modification (null si ajout)
  editingId: string | null = null;

  private fb = inject(FormBuilder);
  private remiseService = inject(RemiseService);
  private ParkingLotService = inject(ParkingLotService);

  constructor(
    public dialogRef: MatDialogRef<RemiseAdminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parking: any // On reçoit l'objet Parking complet
  ) { }

  ngOnInit(): void {
    // 1. Formulaire pour ajouter/modifier une règle de remise (Bloc Bleu)
    this.remiseForm = this.fb.group({
      seuilHeures: ['', [Validators.required, Validators.min(1)]],
      pourcentageRemise: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      description: ['Offre Longue Durée', Validators.required],
      themeVisuel: ['theme-demi', Validators.required]
    });

    // 2. Formulaire pour les tarifs globaux du parking (Bloc Rose)
    // On initialise avec les valeurs existantes ou 0
    this.parkingForm = this.fb.group({
      tarifDepassement: [this.parking.tarifDepassement || 0, [Validators.min(0)]],
      remiseRetard: [this.parking.remiseRetard || 0, [Validators.min(0)]]
    });

    this.loadRemises();
  }

  // 🔄 Charger les remises depuis le serveur
  loadRemises(): void {
    this.remiseService.getByParking(this.parking.id).subscribe({
      next: (data) => {
        this.remises = data.sort((a, b) => b.seuilHeures - a.seuilHeures);
      },
      error: (err) => console.error('Erreur lors du chargement des remises', err)
    });
  }

  // 💾 SAUVEGARDE DU PARKING (Tarifs de dépassement / Bloc Rose)
  saveParkingTarifs(): void {
    if (this.parkingForm.valid) {
      // On prépare l'objet complet à envoyer au Backend
      const updatedParking = {
        ...this.parking,
        tarifDepassement: this.parkingForm.value.tarifDepassement,
        remiseRetard: this.parkingForm.value.remiseRetard
      };

      this.ParkingLotService.updateParking(this.parking.id, updatedParking).subscribe({
        next: (res) => {
          // CRUCIAL : On met à jour l'objet local 'parking' avec la réponse du serveur
          // C'est ce qui permet de garder les valeurs affichées à la réouverture
          this.parking = res; 
          
          // On repatch le formulaire pour confirmer la valeur enregistrée
          this.parkingForm.patchValue({
            tarifDepassement: res.tarifDepassement,
            remiseRetard: res.remiseRetard
          });

          alert('Tarifs dynamiques enregistrés avec succès !');
        },
        error: (err) => {
          console.error('Erreur de mise à jour du parking', err);
          alert('Erreur lors de la sauvegarde du parking au backend.');
        }
      });
    }
  }

  // ✏️ Préparer la modification d'une remise existante
  editRemise(remise: Remise): void {
    if (remise.id) {
      this.editingId = remise.id;
      this.remiseForm.patchValue({
        seuilHeures: remise.seuilHeures,
        pourcentageRemise: remise.pourcentageRemise,
        description: remise.description,
        themeVisuel: remise.themeVisuel || 'theme-demi'
      });
    }
  }

  // 💾 SAUVEGARDE DE LA REMISE (Ajout ou Edition / Bloc Bleu)
  saveRemise(): void {
    if (this.remiseForm.valid) {
      const formValues = this.remiseForm.value;

    const remiseData: Remise = {
      seuilHeures: formValues.seuilHeures,
      pourcentageRemise: formValues.pourcentageRemise,
      description: formValues.description,
      themeVisuel: formValues.themeVisuel,
      parking: { id: this.parking.id }
    };

      if (this.editingId) {
        // Mode Modification
        this.remiseService.updateRemise(this.editingId, remiseData).subscribe({
          next: () => {
            this.resetForm();
            this.loadRemises();
          },
          error: (err) => console.error('Erreur lors de la modification', err)
        });
      } else {
        // Mode Ajout
        this.remiseService.createRemise(remiseData).subscribe({
          next: () => {
            this.resetForm();
            this.loadRemises();
          },
          error: (err) => console.error('Erreur lors de l\'ajout', err)
        });
      }
    }
  }

  // 🗑️ Supprimer une règle de remise
  deleteRemise(id: string): void {
    if (confirm('Voulez-vous vraiment supprimer cette règle tarifaire ?')) {
      this.remiseService.deleteRemise(id).subscribe({
        next: () => {
          if (this.editingId === id) this.resetForm();
          this.loadRemises();
        },
        error: (err) => console.error('Erreur lors de la suppression', err)
      });
    }
  }

  // 🧹 Réinitialiser le formulaire de remise
  resetForm(): void {
    this.editingId = null;
    this.remiseForm.reset({ 
      description: 'Offre Longue Durée', 
      themeVisuel: 'theme-demi' 
    });

    Object.keys(this.remiseForm.controls).forEach(key => {
      this.remiseForm.get(key)?.setErrors(null);
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}