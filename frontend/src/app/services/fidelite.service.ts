import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProfilFidelite {
  id?:                  string;
  email?:               string;
  nomClient?:           string;
  pointsTotal:          number;
  pointsDisponibles:    number;
  pointsUtilises?:      number;
  niveau:               string;
  niveauIcon:           string;
  pointsProchainNiveau: number;
  progressionNiveau:    number;
  matchsJoues:          number;
  matchsCarteActuelle:  number;
  cartesCompletes:      number;
  matchsRestantsCarte:  number;
  prochainMatchGratuit: boolean;
  economiesTotal:       number;
  createdAt?:           string;
  lastActivity?:        string;
  historique?:          HistoriquePoint[];
  abonnementActif?:     AbonnementInfo;
}

export interface HistoriquePoint {
  date:        string;
  type:        string;
  points:      number;
  description: string;
  source:      string;
}

export interface AbonnementInfo {
  type:          string;
  typeLabel:     string;
  dateFin:       string;
  matchsRestants: number;
  reductionPct:  number;
  actif:         boolean;
}

@Injectable({ providedIn: 'root' })
export class FideliteService {

  private apiUrl =
    'http://localhost:8081/api/fidelite';

  constructor(private http: HttpClient) {}

  getProfil(): Observable<ProfilFidelite> {
    return this.http.get<ProfilFidelite>(
      `${this.apiUrl}/mon-profil`);
  }

  calculerReduction(
      montant: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/reduction`,
      { params: { montant: montant.toString() } });
  }

  utiliserPoints(
      points: number,
      montant: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/utiliser-points`,
      { points, montant });
  }

  souscrireAbonnement(
      type: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/abonnement`, { type });
  }

  getLeaderboard(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/leaderboard`);
  }

  getStats(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/stats`);
  }

  ajouterPointsMatch(
      titre: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/points-match`, { titre });
  }
}