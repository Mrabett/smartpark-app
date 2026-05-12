import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: any;
  isLoading?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private api = 'http://localhost:8081/api/chatbot';

  constructor(private http: HttpClient) {}

  sendMessage(message: string,
              history: string): Observable<any> {
    return this.http.post(`${this.api}/message`, {
      message, context: history
    });
  }

  getSuggestions(): Observable<any> {
    return this.http.get(`${this.api}/suggestions`);
  }
}