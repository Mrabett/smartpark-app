import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Terrain {
  id?: string;
  nom: string;
  type: string;
  capacite: number;
  tarifHeure: number;
  statut?: string;
  description?: string;
  equipements?: string[];
}

@Injectable({ providedIn: 'root' })
export class TerrainService {

  private apiUrl = 'http://localhost:8081/api/terrains';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Terrain[]> {
    return this.http.get<Terrain[]>(this.apiUrl);
  }

  getById(id: string): Observable<Terrain> {
    return this.http.get<Terrain>(`${this.apiUrl}/${id}`);
  }

  create(terrain: Terrain): Observable<Terrain> {
    return this.http.post<Terrain>(this.apiUrl, terrain);
  }

  update(id: string, terrain: Terrain): Observable<Terrain> {
    return this.http.put<Terrain>(`${this.apiUrl}/${id}`, terrain);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDisponibles(): Observable<Terrain[]> {
    return this.http.get<Terrain[]>(`${this.apiUrl}/disponibles`);
  }
}