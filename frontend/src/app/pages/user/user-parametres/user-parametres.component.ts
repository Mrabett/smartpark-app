import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService, AuthUser } from '../../../services/auth.service';

@Component({
  selector: 'app-user-parametres',
  standalone: true,
  // ✅ CommonModule + FormsModule OBLIGATOIRES
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-parametres.component.html',
  styleUrl:    './user-parametres.component.scss'
})
export class UserParametresComponent implements OnInit {

  // ✅ Toutes les propriétés déclarées
  user: AuthUser | null = null;
  ongletActif = 'profil';

  profileForm    = { nom: '', telephone: '' };
  profileLoading = false;
  profileMsg     = '';
  profileErreur  = '';

  passwordForm = {
    ancienPassword:  '',
    nouveauPassword: '',
    confirmPassword: ''
  };
  passwordLoading = false;
  passwordMsg     = '';
  passwordErreur  = '';
  showAncien      = false;
  showNouveau     = false;
  showConfirm     = false;

  constructor(
    private auth:   AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    if (this.user) {
      this.profileForm.nom       = this.user.nom       || '';
      this.profileForm.telephone = this.user.telephone || '';
    }
  }

  setOnglet(o: string) {
    this.ongletActif    = o;
    this.profileMsg     = '';
    this.profileErreur  = '';
    this.passwordMsg    = '';
    this.passwordErreur = '';
  }

  getUserInitial(): string {
    return this.user?.nom?.[0]?.toUpperCase() || '?';
  }

  saveProfile() {
    if (!this.profileForm.nom.trim()) {
      this.profileErreur = 'Le nom est obligatoire';
      return;
    }
    this.profileLoading = true;
    this.profileErreur  = '';
    this.profileMsg     = '';

    this.auth.updateProfile(this.profileForm).subscribe({
      next: () => {
        this.profileLoading = false;
        this.profileMsg     = '✅ Profil mis à jour avec succès !';
        this.user           = this.auth.getUser();
        setTimeout(() => this.profileMsg = '', 3000);
      },
      error: (e: any) => {
        this.profileLoading = false;
        this.profileErreur  =
          e.error?.erreur || '⛔ Erreur lors de la mise à jour';
      }
    });
  }

  changePassword() {
    this.passwordErreur = '';
    this.passwordMsg    = '';

    if (!this.passwordForm.ancienPassword) {
      this.passwordErreur = 'Entrez votre ancien mot de passe';
      return;
    }
    if (this.passwordForm.nouveauPassword.length < 6) {
      this.passwordErreur =
        'Le nouveau mot de passe doit avoir au moins 6 caractères';
      return;
    }
    if (this.passwordForm.nouveauPassword !==
        this.passwordForm.confirmPassword) {
      this.passwordErreur = 'Les mots de passe ne correspondent pas';
      return;
    }
    if (this.passwordForm.ancienPassword ===
        this.passwordForm.nouveauPassword) {
      this.passwordErreur =
        'Le nouveau mot de passe doit être différent de l\'ancien';
      return;
    }

    this.passwordLoading = true;

    this.auth.changePassword({
      ancienPassword:  this.passwordForm.ancienPassword,
      nouveauPassword: this.passwordForm.nouveauPassword
    }).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordMsg =
          '✅ Mot de passe modifié ! Reconnexion dans 3 secondes...';
        this.passwordForm = {
          ancienPassword:  '',
          nouveauPassword: '',
          confirmPassword: ''
        };
        setTimeout(() => this.auth.logout(), 3000);
      },
      error: (e: any) => {
        this.passwordLoading = false;
        this.passwordErreur  =
          e.error?.erreur || '⛔ Ancien mot de passe incorrect';
      }
    });
  }

  getPasswordStrength(): number {
    const p = this.passwordForm.nouveauPassword;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6)           score++;
    if (p.length >= 10)          score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^A-Za-z0-9]/.test(p))  score++;
    return score;
  }

  getStrengthLabel(): string {
    const s = this.getPasswordStrength();
    if (s <= 1) return 'Faible';
    if (s <= 3) return 'Moyen';
    return 'Fort';
  }

  getStrengthColor(): string {
    const s = this.getPasswordStrength();
    if (s <= 1) return 'var(--red)';
    if (s <= 3) return 'var(--amber)';
    return 'var(--green)';
  }

  logout() { this.auth.logout(); }
}