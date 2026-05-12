import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { ParkingReservation } from '../../../models/reservation.model';
import { RemiseService } from '../../../../../services/remise.service';
import { Remise } from '../../../models/remise.model';
import { AuthService } from '../../../../../services/auth.service';

export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const dE = group.get('date')?.value;
  const dS = group.get('dateSortie')?.value;

  if (dE && dS) {
    const start = new Date(dE);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dS);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return { 'invalidDateRange': true };
    }
  }
  return null;
}

@Component({
  selector: 'app-reservation-client-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule, MatSelectModule, MatOptionModule
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' }
  ],
  templateUrl: './reservation-client-dialog.component.html',
  styleUrls: ['./reservation-client-dialog.component.css']
})
export class ReservationClientDialogComponent implements OnInit {
  resForm!: FormGroup;
  errorMessage: string = '';
  overlapError: string = ''; // Ajout de la variable d'erreur de chevauchement
  reservations: ParkingReservation[] = [];
  occupiedSlotsEntree: { start: string, end: string }[] = [];
  occupiedSlotsSortie: { start: string, end: string }[] = [];
  today = new Date();
  spot: any;
  isEditMode = false;
  reservationId = '';

  prixApplique: number = 0;
  prixInitial: number = 8;

  remisesAdmin: Remise[] = [];
  dureeHeures: number = 0;
  forfaitActif: Remise | null = null;
  prixTotalCalcule: number = 0;
  themeForfait: string = 'theme-standard';
  minDateStr: string = ''; // Bloquer les dates passées

  private fb = inject(FormBuilder);
  private ParkingReservationService = inject(ParkingReservationService);
  private remiseService = inject(RemiseService);
  private authService = inject(AuthService);

  listeHeures: string[] = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00', '00:00'
  ];

  constructor(
    public dialogRef: MatDialogRef<ReservationClientDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.matricule) {
      this.isEditMode = true;
      this.reservationId = data.id;
      this.spot = data.spot;
    } else {
      this.isEditMode = false;
      this.spot = data;
    }
  }

  ngOnInit(): void {
    const now = new Date();
    this.minDateStr = now.toISOString().split('T')[0];

    this.resForm = this.fb.group({
      matricule: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s\-]{4,15}$/)]],
      date: [new Date(), Validators.required],
      dateSortie: [new Date(), Validators.required],
      heureEntree: ['', Validators.required],
      heureSortie: ['', Validators.required]
    }, { validators: dateRangeValidator });

    if (this.spot && this.spot.id) {
      this.loadOccupiedSlots(this.spot.id);

      const parkingId = this.spot?.parking?.id || this.spot?.parkingId || this.data?.parkingId;
      if (parkingId) {
        this.remiseService.getByParking(parkingId).subscribe({
          next: (data) => {
            this.remisesAdmin = data || [];
            this.remisesAdmin.sort((a, b) => Number(b.seuilHeures) - Number(a.seuilHeures));
            this.calculerForfaitMagique();
          }
        });
      }
    }

    if (this.isEditMode) {
      const entree = new Date(this.data.datetimeEntree);
      const sortie = new Date(this.data.datetimeSortie);

      this.resForm.patchValue({
        matricule: this.data.matricule,
        date: entree,
        dateSortie: sortie,
        heureEntree: entree.toTimeString().substring(0, 5),
        heureSortie: sortie.toTimeString().substring(0, 5)
      });

      if (!this.isModifiable(this.data.datetimeEntree)) {
        this.errorMessage = "Cette réservation est passée ou en cours. Elle ne peut plus être modifiée.";
        this.resForm.disable();
      }
    }

    this.calculerPrixEffectif();

    this.resForm.valueChanges.subscribe(() => {
      this.updateValidators();
      this.calculerForfaitMagique();
      this.verifierChevauchementTempsReel(); // Ajout du temps réel
    });
  }

  isModifiable(datetimeEntree: string): boolean {
    const entree = new Date(datetimeEntree);
    return entree > new Date(); // Si l'entrée est dans le futur, c'est modifiable
  }

  get isSameDay(): boolean {
    const dE = this.resForm.get('date')?.value;
    const dS = this.resForm.get('dateSortie')?.value;
    if (!dE || !dS) return true;

    const dateE = (dE instanceof Date) ? this.formatDate(dE) : dE;
    const dateS = (dS instanceof Date) ? this.formatDate(dS) : dS;

    return dateE === dateS;
  }

  updateValidators(): void {
    const hEControl = this.resForm.get('heureEntree');
    const hSControl = this.resForm.get('heureSortie');

    hEControl?.setValidators(Validators.required);

    if (this.isSameDay) {
      hSControl?.setValidators(Validators.required);
    } else {
      hSControl?.clearValidators();
    }
    hEControl?.updateValueAndValidity({ emitEvent: false });
    hSControl?.updateValueAndValidity({ emitEvent: false });
  }

  calculerPrixEffectif(): void {
    const p = this.spot?.parking;
    if (!p) return;
    const dateVisee = this.resForm?.get('date')?.value || new Date();
    if (p.isEvent && p.dateDebutPromos && p.dateFinPromos) {
      const debut = new Date(p.dateDebutPromos);
      debut.setHours(0, 0, 0, 0); // La promo commence à minuit de la date de début
      const fin = new Date(p.dateFinPromos);
      fin.setHours(23, 59, 59, 999); // Promo valide jusqu'à la dernière minute de la journée de fin
      this.prixApplique = (dateVisee >= debut && dateVisee <= fin) ? p.prixPromos : p.prixInitial;
    } else {
      this.prixApplique = p.prixInitial;
    }
  }

  calculerForfaitMagique(): void {
    this.calculerPrixEffectif();

    const dE = this.resForm.get('date')?.value;
    const dS = this.resForm.get('dateSortie')?.value;
    if (!dE || !dS) return;

    let start = new Date(dE);
    let end = new Date(dS);

    const hE = this.resForm.get('heureEntree')?.value;
    if (!hE) {
      this.dureeHeures = 0;
      this.prixTotalCalcule = 0;
      return;
    }
    const [h1, m1] = hE.split(':').map(Number);
    start.setHours(h1, m1, 0, 0);

    if (this.isSameDay) {
      const hS = this.resForm.get('heureSortie')?.value;
      if (!hS) {
        this.dureeHeures = 0;
        this.prixTotalCalcule = 0;
        return;
      }
      const [h2, m2] = hS === '00:00' ? [24, 0] : hS.split(':').map(Number);
      end.setHours(h2, m2, 0, 0);
    } else {
      end.setHours(23, 59, 59, 0);
    }

    const diffMs = end.getTime() - start.getTime();
    this.dureeHeures = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60)) : 0;

    if (this.dureeHeures <= 0) {
      this.forfaitActif = null;
      this.themeForfait = 'theme-standard';
      this.prixTotalCalcule = 0;
      return;
    }

    const prixBaseTotal = this.dureeHeures * (this.prixApplique || this.prixInitial);
    this.forfaitActif = this.remisesAdmin.find(r => Number(this.dureeHeures) >= Number(r.seuilHeures)) || null;

    if (this.forfaitActif) {
      this.prixTotalCalcule = prixBaseTotal * (1 - (Number(this.forfaitActif.pourcentageRemise) / 100));
      this.themeForfait = this.forfaitActif.themeVisuel || 'theme-standard';
    } else {
      this.prixTotalCalcule = prixBaseTotal;
      this.themeForfait = 'theme-standard';
    }
  }

  verifierChevauchementTempsReel(): void {
    this.overlapError = ''; // Réinitialisation par défaut

    if (this.isSameDay) {
      return;
    }

    const formValues = this.resForm.getRawValue();

    if (!formValues.date || !formValues.dateSortie) {
      return;
    }

    const dateEntreeFormatted = this.formatDate(formValues.date);
    const dateSortieFormatted = this.formatDate(formValues.dateSortie);
    const datetimeSortieStr = `${dateSortieFormatted}T23:59:59`;
    const newEnd = new Date(datetimeSortieStr).getTime();

    if (!formValues.heureEntree) {
      const lendemain = new Date(formValues.date);
      lendemain.setDate(lendemain.getDate() + 1);
      lendemain.setHours(0, 0, 0, 0);
      const startLendemain = lendemain.getTime();

      const hasOverlapFuture = this.reservations.some(res => {
        if (this.isEditMode && res.id === this.reservationId) return false;
        const resStart = new Date(res.datetimeEntree).getTime();
        const resEnd = new Date(res.datetimeSortie).getTime();
        return (startLendemain < resEnd) && (newEnd > resStart);
      });

      if (hasOverlapFuture) {
        this.overlapError = "Attention : Ce spot est déjà réservé sur les jours suivants ! Une réservation continue est impossible.";
      }
      return;
    }

    const datetimeEntreeStr = `${dateEntreeFormatted}T${formValues.heureEntree}:00`;
    const newStart = new Date(datetimeEntreeStr).getTime();

    const hasOverlap = this.reservations.some(res => {
      if (this.isEditMode && res.id === this.reservationId) return false;
      const resStart = new Date(res.datetimeEntree).getTime();
      const resEnd = new Date(res.datetimeSortie).getTime();
      return (newStart < resEnd) && (newEnd > resStart);
    });

    if (hasOverlap) {
      this.overlapError = "Attention : Ce spot est déjà réservé en partie sur cette période ! Veuillez ajuster vos dates ou votre heure d'entrée.";
    }
  }

  loadOccupiedSlots(spotId: string): void {
    this.ParkingReservationService.getReservationsBySpot(spotId).subscribe({
      next: (data) => {
        // Exclure la réservation en cours de modification
        this.reservations = this.isEditMode
          ? data.filter((res: any) => String(res.id) !== String(this.reservationId))
          : data;
        // Recalculer les créneaux pour les dates actuellement sélectionnées
        const dateEntree = this.resForm.get('date')?.value;
        const dateSortie = this.resForm.get('dateSortie')?.value;
        this.checkOccupiedSlots(dateEntree || new Date(), true);
        this.checkOccupiedSlots(dateSortie || dateEntree || new Date(), false);
        this.verifierChevauchementTempsReel();
      },
      error: (err) => console.error('Erreur de chargement', err)
    });
  }

  onDateChange(event: any): void {
    const input = event.target as HTMLInputElement;
    const dateVal = (input && input.value) ? input.value : (event.value ? event.value : null);
    if (dateVal) {
      this.checkOccupiedSlots(dateVal, true);
    }
  }

  onDateChangeSortie(event: any): void {
    const input = event.target as HTMLInputElement;
    const dateVal = (input && input.value) ? input.value : (event.value ? event.value : null);
    if (dateVal) {
      this.checkOccupiedSlots(dateVal, false);
    }
  }

  checkOccupiedSlots(selectedDate: any, isEntree: boolean = true): void {
    const dateStr = this.formatDate(selectedDate);
    if (!dateStr) return;

    const slots = this.reservations
      .filter(res => {
        if (res.statusAction === 'SORTIE_VALIDEE' || res.statusAction === 'ANNULEE') return false;
        if (!res.datetimeEntree) return false;

        const resStartDateStr = res.datetimeEntree.split('T')[0];

        if (resStartDateStr === dateStr) return true;

        if (resStartDateStr < dateStr) {
          if (!res.datetimeSortie) return true;
          const resEndDateStr = res.datetimeSortie.split('T')[0];
          return resEndDateStr >= dateStr;
        }
        return false;
      })
      .map(res => {
        const resStartDateStr = res.datetimeEntree.split('T')[0];
        const start = (resStartDateStr < dateStr) ? '00:00' : (res.datetimeEntree.split('T')[1]?.substring(0, 5) || '00:00');
        const end = res.datetimeSortie ? (res.datetimeSortie.split('T')[1]?.substring(0, 5) || '00:00') : '00:00';
        return { start, end };
      });

    if (isEntree) {
      this.occupiedSlotsEntree = slots;
    } else {
      this.occupiedSlotsSortie = slots;
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    if (typeof date === 'string') return date.split('T')[0];
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return '';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  submit(): void {
    if (this.resForm.valid && this.spot.id) {
      const formValues = this.resForm.getRawValue();

      const dateEntreeFormatted = this.formatDate(formValues.date);
      const dateSortieFormatted = this.formatDate(formValues.dateSortie);

      let datetimeEntreeStr = '';
      let datetimeSortieStr = '';

      if (this.isSameDay) {
        if (this.val(formValues.heureSortie) <= this.val(formValues.heureEntree)) {
          this.errorMessage = "L'heure de sortie doit être après l'heure d'entrée.";
          return;
        }
        datetimeEntreeStr = `${dateEntreeFormatted}T${formValues.heureEntree}:00`;
        let heureSortie = formValues.heureSortie === '00:00' ? '23:59:00' : `${formValues.heureSortie}:00`;
        datetimeSortieStr = `${dateSortieFormatted}T${heureSortie}`;
      } else {
        datetimeEntreeStr = `${dateEntreeFormatted}T${formValues.heureEntree}:00`;
        datetimeSortieStr = `${dateSortieFormatted}T23:59:59`;
      }

      const newStart = new Date(datetimeEntreeStr).getTime();
      const newEnd = new Date(datetimeSortieStr).getTime();

      const hasOverlap = this.reservations.some(res => {
        if (this.isEditMode && res.id === this.reservationId) return false;
        const existingStart = new Date(res.datetimeEntree).getTime();
        const existingEnd = new Date(res.datetimeSortie).getTime();
        return (newStart < existingEnd) && (newEnd > existingStart);
      });

      if (hasOverlap) {
        this.errorMessage = "Conflit : La période choisie chevauche une réservation existante.";
        return;
      }

      this.calculerForfaitMagique();

      const user = this.authService.getUser();

      const resData: any = {
        matricule: formValues.matricule.toUpperCase(),
        date: `${dateEntreeFormatted}T00:00:00`,
        dateSortie: `${dateSortieFormatted}T00:00:00`,
        datetimeEntree: datetimeEntreeStr,
        datetimeSortie: datetimeSortieStr,
        spotId: this.spot.id, // 🟢 LA CORRECTION EST ICI
        montant: this.prixTotalCalcule,
        userId: user?.email,
        userName: user?.nom
      };

      const action = this.isEditMode
        ? this.ParkingReservationService.updateReservation(this.reservationId, resData)
        : this.ParkingReservationService.createReservation(resData);

      action.subscribe({
        next: (res) => {
          const status = this.isEditMode ? "modifiée" : "confirmée";
          alert(`Réservation ${status} ! Total à payer : ${this.prixTotalCalcule.toFixed(2)} TND.`);
          this.dialogRef.close(true);
        },
        error: (err) => this.errorMessage = "Erreur serveur. Ce créneau est peut-être indisponible."
      });
    }
  }

  val(h: string): string {
    if (!h) return '';
    return h === '00:00' ? '24:00' : h;
  }

  /** Heure courante au format "HH:MM" */
  get heureActuelle(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /** Vrai si la date d'entrée sélectionnée est aujourd'hui */
  get isDateEntreeAujourdhui(): boolean {
    const dE = this.resForm.get('date')?.value;
    if (!dE) return false;
    const d = new Date(dE);
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }

  myDateFilter = (d: Date | null): boolean => {
    const date = d || new Date();
    const todayZero = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    return date >= todayZero;
  };

  isHeureEntreeReservee(heure: string): boolean {
    if (!this.resForm.get('date')?.value) return true;
    const valH = this.val(heure);
    return this.occupiedSlotsEntree.some((slot: any) => {
      const vStart = this.val(slot.start);
      const vEnd = (slot.end === '00:00') ? '24:01' : this.val(slot.end);
      return valH >= vStart && valH < vEnd;
    });
  }

  isHeureSortieReservee(heure: string): boolean {
    const hE = this.resForm.get('heureEntree')?.value;
    if (!hE) return false; // Ne rien bloquer tant que l'entrée n'est pas choisie

    const valH = this.val(heure);
    const valHE = this.val(hE);

    // 1. Si c'est le même jour, on bloque les heures avant ou égales à l'entrée
    if (this.isSameDay && valH <= valHE) return true;

    // 2. Bloquer si l'heure est à l'intérieur d'un créneau déjà occupé le jour de sortie
    const estDansUnSlot = this.occupiedSlotsSortie.some((slot: any) => {
      return valH > this.val(slot.start) && valH < this.val(slot.end);
    });
    if (estDansUnSlot) return true;

    // 3. Bloquer si on dépasse sur la PROCHAINE réservation
    // On cherche la première réservation qui commence APRÈS notre heure d'entrée
    const prox = this.occupiedSlotsSortie
      .filter((s: any) => {
        const vStart = this.val(s.start);
        return this.isSameDay ? (vStart > valHE) : true;
      })
      .sort((a: any, b: any) => this.val(a.start).localeCompare(this.val(b.start)))[0];

    // Si une réservation existe après, on ne peut pas sortir APRES son début
    return !!(prox && valH > this.val(prox.start));
  }

  close(): void {
    this.dialogRef.close(false);
  }
}