import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root' // Disponible partout dans l'application
})
export class ParkingContextService {
    // On lit le localStorage au démarrage au cas où l'employé a déjà choisi un parking
    private activeParkingIdSource = new BehaviorSubject<string | null>(
        localStorage.getItem('activeParkingId')
    );

    // Observable que tes autres composants pourront écouter
    activeParkingId$ = this.activeParkingIdSource.asObservable();

    // Méthode pour mettre à jour le parking
    setActiveParking(parkingId: string): void {
        localStorage.setItem('activeParkingId', parkingId); // Sauvegarde
        this.activeParkingIdSource.next(parkingId);         // Notifie l'application
    }

    // Méthode simple pour récupérer l'ID actuel sans s'abonner
    getCurrentParkingId(): string | null {
        return this.activeParkingIdSource.value;
    }
}