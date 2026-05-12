import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  loading?:  boolean;
}

export interface RecommandationRequest {
  sport:          string;
  nbJoueurs:      number;
  niveauJoueur:   string;
  momentPrefere:  string;
  budgetMax:      number;
  preferences:    string[];
}

@Injectable({ providedIn: 'root' })
export class IaService {

  private apiUrl = 'http://localhost:8081/api/ia';

  constructor(private http: HttpClient) {}

  chat(message: string, contexte = 'general'):
      Observable<any> {
    return this.http.post(`${this.apiUrl}/chat`, {
      message, contexte
    });
  }

  recommander(req: RecommandationRequest):
      Observable<any[]> {
    return this.http.post<any[]>(
      `${this.apiUrl}/recommander`, req);
  }

  getSentiments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/sentiments`);
  }

  analyserNote(texte: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/analyser-note`, { texte });
  }
}