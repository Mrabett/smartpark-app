import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecetteDTO } from '../pages/parking/models/recette.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecetteService {
  private apiUrl = `${environment.apiBaseUrl}/recettes`;
  private http = inject(HttpClient);

  getAdminStats(): Observable<RecetteDTO> {
    return this.http.get<RecetteDTO>(`${this.apiUrl}/admin-stats`);
  }
}
