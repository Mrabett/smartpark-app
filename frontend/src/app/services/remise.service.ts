import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Remise } from '../pages/parking/models/remise.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RemiseService {
  private apiUrl = `${environment.apiBaseUrl}/remises`;
  private http = inject(HttpClient);

  getByParking(parkingId: string): Observable<Remise[]> {
    return this.http.get<Remise[]>(`${this.apiUrl}/parking/${parkingId}`);
  }

  createRemise(remise: Remise): Observable<Remise> {
    return this.http.post<Remise>(this.apiUrl, remise);
  }

  updateRemise(id: string, remise: Remise): Observable<Remise> {
    return this.http.put<Remise>(`${this.apiUrl}/${id}`, remise);
  }

  deleteRemise(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
