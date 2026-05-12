import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ParkingReservationService } from '../../../../../services/parking-reservation.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ParkingContextService } from '../../../../../services/parking-context.service';
import { ParkingLotService } from '../../../../../services/parking-lot.service';
import { MatDialog } from '@angular/material/dialog';
import { trigger, transition, style, animate } from '@angular/animations';
import { SelectSpotDialogComponent } from '../select-spot-dialog/select-spot-dialog.component';

interface Detection {
    id: string;
    matricule: string;
    imageEntree: string;
    spontane: boolean;
    heureDetectionIa: string;
    dismissed: boolean;
}

@Component({
    selector: 'app-detection-popup',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    templateUrl: './detection-popup.component.html',
    styleUrls: ['./detection-popup.component.css'],
    // 👇 2. On définit l'animation @slideIn ici
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateY(-20px)', opacity: 0 }),
                animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(-20px)', opacity: 0 }))
            ])
        ])
    ]
})
export class DetectionPopupComponent implements OnInit, OnDestroy {

    detections: Detection[] = [];
    private pollSub?: Subscription;
    private dejaVus = new Set<string>();

    private reservationService = inject(ParkingReservationService);
    private router = inject(Router);
    private parkingContext = inject(ParkingContextService);
    private parkingLotService = inject(ParkingLotService);
    private dialog = inject(MatDialog);
    parkingActuel: any = null;
    ngOnInit(): void {
        const parkingId = this.parkingContext.getCurrentParkingId();
        if (parkingId) {
            this.parkingLotService.getParkingById(parkingId).subscribe(p => {
                this.parkingActuel = p;
            });
        }
        this.pollSub = interval(3000).pipe(
            switchMap(() => this.reservationService.getEnCours())
        ).subscribe({
            next: (data: any[]) => {
                data.forEach(res => {
                    const dejaPresent = this.detections.some(d => d.id === res.id);
                    if (!dejaPresent && !this.dejaVus.has(res.id)) {
                        this.detections.push({
                            id: res.id,
                            matricule: res.matricule,
                            imageEntree: res.imageEntree,
                            spontane: res.spontane,
                            heureDetectionIa: res.heureDetectionIa,
                            dismissed: false
                        });
                    }
                });

                const idsActifs = new Set(data.map((r: any) => r.id));
                this.detections = this.detections.filter(d => idsActifs.has(d.id));
            },
            error: (err) => console.error('Erreur polling détections :', err)
        });
    }

    ngOnDestroy(): void {
        this.pollSub?.unsubscribe();
    }

    confirmerSpontane(detection: Detection): void {
        const parkingId = this.parkingContext.getCurrentParkingId();

        const dialogRef = this.dialog.open(SelectSpotDialogComponent, {
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            panelClass: 'full-screen-dialog',
            data: { parkingId: parkingId, matricule: detection.matricule }
        });

        dialogRef.afterClosed().subscribe(spotId => {
            if (spotId) {
                const updateData = {
                    parkingId: parkingId,
                    spotId: spotId,
                    statusAction: 'ATTENTE',
                    montantFinal: this.prixAffiche
                };

                this.reservationService.validerFlux(detection.id, updateData).subscribe({
                    next: () => {
                        console.log("✅ Entrée spontanée avec spot validée");
                        this.dejaVus.add(detection.id);
                        this.detections = this.detections.filter(d => d.id !== detection.id);
                        this.router.navigate(['/ticket', detection.id]);
                    },
                    error: (err) => {
                        console.error("❌ Erreur validation spot spontanée:", err);
                        alert("Erreur réseau");
                    }
                });
            }
        });
    }

    pasSpontane(detection: Detection): void {
        this.dejaVus.add(detection.id);
        this.detections = this.detections.filter(d => d.id !== detection.id);
    }

    get hasDetections(): boolean {
        return this.detections.length > 0;
    }

    get prixAffiche(): number {
        if (!this.parkingActuel) return 0;
        // Si promo active, on prend le prix promo, sinon le prix initial
        return this.parkingActuel.prixPromos > 0
            ? this.parkingActuel.prixPromos
            : this.parkingActuel.prixInitial;
    }
}