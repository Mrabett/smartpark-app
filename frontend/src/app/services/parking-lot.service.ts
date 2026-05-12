import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Parking } from '../pages/parking/models/parking.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParkingLotService {
  private apiUrl = `${environment.apiBaseUrl}/parkings`;
  private http = inject(HttpClient);

  getAllParkings(): Observable<Parking[]> {
    return this.http.get<Parking[]>(this.apiUrl);
  }

  createParking(parking: Parking): Observable<Parking> {
    return this.http.post<Parking>(this.apiUrl, parking);
  }

  updateParking(id: string, parking: Parking): Observable<Parking> {
    return this.http.put<Parking>(`${this.apiUrl}/${id}`, parking);
  }

  deleteParking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getParkingById(id: string): Observable<Parking> {
    return this.http.get<Parking>(`${this.apiUrl}/${id}`);
  }
}
