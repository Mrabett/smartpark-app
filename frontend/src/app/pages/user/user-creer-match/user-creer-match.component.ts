import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatchService } from '../../../services/match.service';
import { TerrainService } from '../../../services/terrain.service';

@Component({
  selector: 'app-user-creer-match',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-creer-match.component.html',
  styleUrl:    './user-creer-match.component.scss'
})
export class UserCreerMatchComponent implements OnInit {

  form = {
    titre:        '',
    sport:        'football',
    format:       '5v5',
    niveau:       'intermediaire',
    description:  '',
    terrainId:    '',
    date:         '',
    heure:        '18:00',
    nbJoueursMax: 10
  };

  terrains: any[] = [];
  loading   = false;
  erreur    = '';
  today     = '';

  sports = [
    { value: 'football',   label: '⚽ Football'   },
    { value: 'tennis',     label: '🎾 Tennis'     },
    { value: 'padel',      label: '🏓 Padel'      },
    { value: 'basketball', label: '🏀 Basketball' },
    { value: 'volleyball', label: '🏐 Volleyball' }
  ];

  formats: { [key: string]: string[] } = {
    football:   ['5v5', '7v7', '11v11'],
    tennis:     ['1v1', '2v2'],
    padel:      ['2v2'],
    basketball: ['3v3', '5v5'],
    volleyball: ['6v6']
  };

  niveaux = [
    { value: 'debutant',      label: '🟢 Débutant'      },
    { value: 'intermediaire', label: '🟡 Intermédiaire' },
    { value: 'expert',        label: '🔴 Expert'         }
  ];

  constructor(
    private svc:        MatchService,
    private terrainSvc: TerrainService,
    private router:     Router
  ) {}

  ngOnInit() {
    this.today     = new Date()
      .toISOString().split('T')[0];
    this.form.date = this.today;
    this.terrainSvc.getAll().subscribe({
      next: (data) => { this.terrains = data; }
    });
    this.updateFormat();
  }

  updateFormat() {
    const f = this.formats[this.form.sport];
    if (f && f.length > 0) {
      this.form.format = f[0];
      this.updateNbJoueurs();
    }
  }

  updateNbJoueurs() {
    const match = this.form.format.match(/(\d+)v(\d+)/);
    if (match) {
      this.form.nbJoueursMax = parseInt(match[1]) * 2;
    }
  }

  getFormats(): string[] {
    return this.formats[this.form.sport] || ['5v5'];
  }

  getTitreSuggere(): string {
    const icons: any = {
      football: '⚽', tennis: '🎾', padel: '🏓',
      basketball: '🏀', volleyball: '🏐'
    };
    const icon  = icons[this.form.sport] || '🏟️';
    const sport = this.form.sport.charAt(0).toUpperCase()
      + this.form.sport.slice(1);
    return `${icon} Match ${this.form.format} ${sport}`;
  }

  // ✅ FIX — méthode simple sans find() dans template
  getSportIconActuel(): string {
    const icons: any = {
      football: '⚽', tennis: '🎾', padel: '🏓',
      basketball: '🏀', volleyball: '🏐'
    };
    return icons[this.form.sport] || '🏟️';
  }

  getNiveauBadgeActuel(): string {
    if (this.form.niveau === 'expert')
      return 'badge-red';
    if (this.form.niveau === 'intermediaire')
      return 'badge-amber';
    return 'badge-green';
  }

  getProgressActuel(): string {
    if (!this.form.nbJoueursMax) return '0%';
    return (1 / this.form.nbJoueursMax * 100) + '%';
  }

  remplirTitre() {
    if (!this.form.titre) {
      this.form.titre = this.getTitreSuggere();
    }
  }

  soumettre() {
    this.erreur = '';
    if (!this.form.titre.trim()) {
      this.erreur = 'Le titre est obligatoire';
      return;
    }
    if (!this.form.date) {
      this.erreur = 'La date est obligatoire';
      return;
    }
    if (!this.form.heure) {
      this.erreur = "L'heure est obligatoire";
      return;
    }
    if (this.form.nbJoueursMax < 2) {
      this.erreur = 'Minimum 2 joueurs requis';
      return;
    }
    this.loading = true;
    this.svc.creer(this.form).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/user/matchs']);
      },
      error: (e: any) => {
        this.loading = false;
        this.erreur  =
          e.error?.erreur || '⛔ Erreur de création';
      }
    });
  }
}