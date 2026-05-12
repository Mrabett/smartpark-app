// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  email     = '';
  password  = '';
  erreur    = '';
  loading   = false;
  showPwd   = false;
  remember  = false;

  // États focus pour animation des champs
  focusEmail = false;
  focusPwd   = false;

  // ✅ Étoiles générées dynamiquement
  stars: Array<{
    x: number; y: number;
    size: number; delay: number; dur: number;
  }> = [];

  constructor(
    private auth:   AuthService,
    private router: Router
  ) {
    if (this.auth.isLoggedIn()) {
      this.redirect();
    }
  }

  ngOnInit() {
    // Générer 60 étoiles aléatoires
    this.stars = Array.from({ length: 60 }, () => ({
      x:     Math.random() * 100,
      y:     Math.random() * 60,
      size:  Math.random() * 2 + 1,
      delay: Math.random() * 5,
      dur:   Math.random() * 3 + 2,
    }));
  }

  login() {
    if (!this.email || !this.password) {
      this.erreur = 'Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.erreur  = '';

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.redirect();
      },
      error: (e) => {
        this.loading = false;
        this.erreur  =
          e.error?.erreur || 'Email ou mot de passe incorrect';
      }
    });
  }

  redirect() {
    if (this.auth.isAdmin()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/user/terrains']);
    }
  }

  fillAdmin() {
    this.email    = 'admin@smartpark.tn';
    this.password = 'admin123';
  }
}