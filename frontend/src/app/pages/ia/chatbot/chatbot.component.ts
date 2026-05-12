import { Component, OnInit, ViewChild,
         ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IaService, ChatMessage } from '../../../services/ia.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chatbot.component.html',
  styleUrl:    './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  inputMessage = '';
  isLoading    = false;

  suggestionsRapides = [
    '🏟️ Quels terrains sont disponibles ?',
    '💰 Comment fonctionne la tarification ?',
    '📅 Comment faire une réservation ?',
    '❌ Comment annuler une réservation ?',
    '⏰ Quels sont les horaires ?'
  ];

  constructor(private iaSvc: IaService) {}

  ngOnInit() {
    // Message d'accueil
    this.messages.push({
      role:      'assistant',
      content:   '👋 Bonjour ! Je suis l\'assistant IA SmartPark. '
               + 'Je peux vous aider avec vos réservations, '
               + 'les tarifs et les terrains disponibles. '
               + 'Comment puis-je vous aider ?',
      timestamp: new Date()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  envoyerMessage() {
    const msg = this.inputMessage.trim();
    if (!msg || this.isLoading) return;

    // Ajouter message user
    this.messages.push({
      role:      'user',
      content:   msg,
      timestamp: new Date()
    });

    this.inputMessage = '';
    this.isLoading    = true;

    // Message de chargement
    const loadingMsg: ChatMessage = {
      role:      'assistant',
      content:   '...',
      timestamp: new Date(),
      loading:   true
    };
    this.messages.push(loadingMsg);

    this.iaSvc.chat(msg).subscribe({
      next: (res) => {
        // Remplacer le message de chargement
        const idx = this.messages.indexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = {
            role:      'assistant',
            content:   res.reponse,
            timestamp: new Date(),
            loading:   false
          };
        }
        this.isLoading = false;
      },
      error: () => {
        const idx = this.messages.indexOf(loadingMsg);
        if (idx !== -1) {
          this.messages[idx] = {
            role:      'assistant',
            content:   '⚠️ Service temporairement indisponible. '
                     + 'Réessayez dans quelques instants.',
            timestamp: new Date(),
            loading:   false
          };
        }
        this.isLoading = false;
      }
    });
  }

  utiliserSuggestion(s: string) {
    this.inputMessage = s.replace(/^[^\w]+/, '').trim();
    this.envoyerMessage();
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.envoyerMessage();
    }
  }

  effacerChat() {
    this.messages = [{
      role:      'assistant',
      content:   '🔄 Conversation réinitialisée. '
               + 'Comment puis-je vous aider ?',
      timestamp: new Date()
    }];
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  formatTime(d: Date): string {
    return new Date(d).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}