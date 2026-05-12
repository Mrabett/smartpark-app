import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ParkingReservation } from '../pages/parking/models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ParkingReservationService {
  private apiUrl = `${environment.apiBaseUrl}/parking-reservations`;
  private http = inject(HttpClient);

  getAllReservations(): Observable<ParkingReservation[]> {
    return this.http.get<ParkingReservation[]>(this.apiUrl);
  }

  getReservationById(id: string): Observable<ParkingReservation> {
    return this.http.get<ParkingReservation>(`${this.apiUrl}/${id}`);
  }

  createReservation(reservation: ParkingReservation): Observable<ParkingReservation> {
    return this.http.post<ParkingReservation>(this.apiUrl, reservation);
  }

  updateReservation(id: string, reservation: Partial<ParkingReservation>): Observable<ParkingReservation> {
    return this.http.put<ParkingReservation>(`${this.apiUrl}/${id}`, reservation);
  }

  deleteReservation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancelReservation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getReservationsBySpot(spotId: string): Observable<ParkingReservation[]> {
    return this.http.get<ParkingReservation[]>(`${this.apiUrl}/spot/${spotId}`);
  }

  getReservationsByParking(parkingId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/parking/${parkingId}`);
  }

  validerFlux(id: string, updates: {
    statusAction: string;
    montantFinal?: number;
    imageEntree?: string;
    imageSortie?: string;
  }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/valider-flux`, updates);
  }

  enregistrerEntreeIA(data: Partial<ParkingReservation>): Observable<ParkingReservation> {
    return this.http.post<ParkingReservation>(`${this.apiUrl}/entree-ia`, data);
  }

  getReservationsByUser(userId: string): Observable<ParkingReservation[]> {
    return this.http.get<ParkingReservation[]>(`${this.apiUrl}/user/${userId}`);
  }

  getEnCours(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/en-cours`); // <-- Corrigé ici
  }

  getLatestExitImage(): Observable<{ image: string }> {
    return this.http.get<{ image: string }>(`${this.apiUrl}/latest-exit-image`);
  }

  getLatestEntryImage(): Observable<{image: string, timestamp?: string}> {
    return this.http.get<{image: string, timestamp?: string}>(`${this.apiUrl}/latest-entry-image`);
  }

  getTicketPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf/${id}`, { responseType: 'blob' }); // <-- Corrigé ici
  }
}