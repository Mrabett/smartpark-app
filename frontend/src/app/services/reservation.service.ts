import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Reservation {
  id?:             string;
  terrainId:       string;
  terrainNom?:     string;
  clientNom:       string;
  clientEmail:     string;
  clientTel:       string;
  dateReservation: string;
  heureDebut:      string;
  heureFin:        string;
  montantTotal?:   number;
  statut?:         string;
  notes?:          string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {

  private apiUrl = `${environment.apiBaseUrl}/reservations`;

  constructor(private http: HttpClient) {}

  // ✅ ADMIN — toutes les réservations
  getAll(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.apiUrl);
  }

  getById(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  create(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  annuler(id: string): Observable<Reservation> {
    return this.http.put<Reservation>(
      `${this.apiUrl}/${id}/annuler`, {}
    );
  }

  confirmer(id: string): Observable<Reservation> {
    return this.http.put<Reservation>(
      `${this.apiUrl}/${id}/confirmer`, {}
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByTerrain(terrainId: string): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(
      `${this.apiUrl}/terrain/${terrainId}`
    );
  }

  getOccupation(terrainId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/stats/occupation/${terrainId}`
    );
  }

  getRevenus(terrainId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/stats/revenus/${terrainId}`
    );
  }

  // ✅ USER — seulement SES réservations via JWT
  getMesReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(
      `${this.apiUrl}/mes-reservations`
    );
    // Le token JWT est envoyé automatiquement par l'intercepteur
    // Le backend extrait l'email et filtre par email
  }

  hasActiveReservation(): Observable<{ eligible: boolean }> {
    return this.http.get<{ eligible: boolean }>(
      `${this.apiUrl}/has-active`
    );
  }
}