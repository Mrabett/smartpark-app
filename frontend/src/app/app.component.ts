import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  constructor(private auth: AuthService) {}

  isLoggedIn(): boolean { return this.auth.isLoggedIn(); }
  isAdmin():    boolean { return this.auth.isAdmin(); }
  isUser():     boolean { return this.auth.isUser(); }

  getUserNom(): string {
    return this.auth.getUser()?.nom || 'Utilisateur';
  }

  getUserInitial(): string {
    return this.auth.getUser()?.nom?.[0]?.toUpperCase() || '?';
  }

  logout() { this.auth.logout(); }
}