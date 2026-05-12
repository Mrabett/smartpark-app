import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  nom       = '';
  email     = '';
  password  = '';
  password2 = '';
  telephone = '';
  erreur    = '';
  loading   = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  register() {
    this.erreur = '';

    if (!this.nom || !this.email ||
        !this.password || !this.telephone) {
      this.erreur = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.password !== this.password2) {
      this.erreur = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.password.length < 6) {
      this.erreur = 'Le mot de passe doit avoir au moins 6 caractères';
      return;
    }

    this.loading = true;

    this.auth.register({
      nom:       this.nom,
      email:     this.email,
      password:  this.password,
      telephone: this.telephone
    }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/user/terrains']);
      },
      error: (e) => {
        this.loading = false;
        this.erreur  = e.error?.erreur || 'Erreur lors de l\'inscription';
      }
    });
  }
}