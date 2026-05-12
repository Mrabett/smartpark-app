import { Component, OnInit, ViewChild,
         ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit, AfterViewChecked {

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMessage[]  = [];
  inputMessage             = '';
  isLoading                = false;
  isFocused                = false;
  suggestions: string[]    = [];
  conversationHistory      = '';
  private shouldScroll     = false;

  constructor(
    private chatbotSvc: ChatbotService,
    private router: Router
  ) {}

  ngOnInit() {
    this.messages.push({
      role: 'assistant',
      content: '👋 Bonjour ! Je suis l\'assistant IA de SmartPark. '
             + 'Je peux vous aider à trouver un terrain, '
             + 'connaître les tarifs ou faire une réservation. '
             + 'Comment puis-je vous aider ?',
      timestamp: new Date()
    });

    this.chatbotSvc.getSuggestions().subscribe({
      next: (s) => this.suggestions = s.suggestions || []
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  sendMessage(text?: string) {
    const msg = (text || this.inputMessage).trim();
    if (!msg || this.isLoading) return;

    this.messages.push({
      role: 'user', content: msg, timestamp: new Date()
    });
    this.conversationHistory += `USER: ${msg}\n`;
    this.inputMessage = '';
    this.isLoading = true;
    this.shouldScroll = true;

    const loadingMsg: ChatMessage = {
      role: 'assistant', content: '',
      timestamp: new Date(), isLoading: true
    };
    this.messages.push(loadingMsg);
    this.shouldScroll = true;

    this.chatbotSvc.sendMessage(msg, this.conversationHistory)
      .subscribe({
        next: (res) => {
          const idx = this.messages.indexOf(loadingMsg);
          if (idx !== -1) {
            this.messages[idx] = {
              role: 'assistant',
              content: res.response,
              timestamp: new Date(),
              intent: res.intent
            };
          }
          this.conversationHistory += `AI: ${res.response}\n`;
          this.isLoading   = false;
          this.shouldScroll = true;
        },
        error: () => {
          const idx = this.messages.indexOf(loadingMsg);
          if (idx !== -1) {
            this.messages[idx] = {
              role: 'assistant',
              content: 'Désolé, je rencontre un problème. Veuillez réessayer.',
              timestamp: new Date()
            };
          }
          this.isLoading   = false;
          this.shouldScroll = true;
        }
      });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  navigateTo(action: string) {
    if (action) this.router.navigate([action]);
  }

  clearChat() {
    this.messages = [];
    this.conversationHistory = '';
    this.ngOnInit();
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  }
}