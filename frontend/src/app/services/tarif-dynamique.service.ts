import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TarifDynamiqueService {
  private api = 'http://localhost:8081/api/tarifs';

  constructor(private http: HttpClient) {}

  calculer(terrainId: string, date: string,
           heureDebut: string): Observable<any> {
    return this.http.get(
      `${this.api}/calculer?terrainId=${terrainId}` +
      `&date=${date}&heureDebut=${heureDebut}`);
  }

  getMeilleursCreneaux(terrainId: string,
                       date: string): Observable<any> {
    return this.http.get(
      `${this.api}/meilleurs-creneaux` +
      `?terrainId=${terrainId}&date=${date}`);
  }

  getAnalyseGlobale(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/analyse-globale`);
  }
}