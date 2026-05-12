import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Match {
  id?:             string;
  titre:           string;
  sport:           string;
  format:          string;
  niveau:          string;
  description?:    string;
  terrainId?:      string;
  terrainNom?:     string;
  date:            string;
  heure:           string;
  nbJoueursMax:    number;
  nbJoueursActuel: number;
  placesRestantes: number;
  createurId?:     string;
  createurNom?:    string;
  joueurs?:        string[];

  // ✅ NOUVEAU
  listeAttente?:   string[];
  nbAttente?:      number;
  positionAttente?: number;

  statut?:         string;
  createdAt?:      string;
  estInscrit?:     boolean;
  estCreateur?:    boolean;

  // ✅ NOUVEAU
  estEnAttente?:   boolean;
}
@Injectable({ providedIn: 'root' })
export class MatchService {

  private apiUrl = 'http://localhost:8081/api/matchs';

  constructor(private http: HttpClient) {}

  // Créer un match
  creer(match: Partial<Match>): Observable<Match> {
    return this.http.post<Match>(this.apiUrl, match);
  }

  // Matchs ouverts
  getOuverts(): Observable<Match[]> {
    return this.http.get<Match[]>(this.apiUrl);
  }

  // Tous les matchs (admin)
  getTous(): Observable<Match[]> {
    return this.http.get<Match[]>(
      `${this.apiUrl}/tous`);
  }

  // Mes matchs
  getMesMatchs(): Observable<Match[]> {
    return this.http.get<Match[]>(
      `${this.apiUrl}/mes-matchs`);
  }

  // Stats admin
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  // Rejoindre
  rejoindre(id: string): Observable<Match> {
    return this.http.post<Match>(
      `${this.apiUrl}/${id}/rejoindre`, {});
  }

  // Quitter
  quitter(id: string): Observable<Match> {
    return this.http.post<Match>(
      `${this.apiUrl}/${id}/quitter`, {});
  }

  // Annuler
  annuler(id: string): Observable<Match> {
    return this.http.put<Match>(
      `${this.apiUrl}/${id}/annuler`, {});
  }
  quitterAttente(id: string): Observable<Match> {
  return this.http.post<Match>(
    `${this.apiUrl}/${id}/quitter-attente`, {});
}
terminerMatch(id: string): Observable<any> {
  return this.http.put(
    `${this.apiUrl}/${id}/terminer`, {});
}


}