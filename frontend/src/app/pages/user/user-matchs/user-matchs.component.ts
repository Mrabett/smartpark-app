import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  MatchService, Match
} from '../../../services/match.service';

@Component({
  selector: 'app-user-matchs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-matchs.component.html',
  styleUrl:    './user-matchs.component.scss'
})
export class UserMatchsComponent implements OnInit {

  matchs:        Match[] = [];
  matchsFiltres: Match[] = [];
  mesMatchs:     Match[] = [];
  loading        = true;
  message        = '';
  messageType    = 'success';
  onglet         = 'tous';
  filtreSport    = 'TOUS';

  // ✅ Modal détail
  matchSelectionne: Match | null = null;
  modalOuvert      = false;

  Math = Math;

  sports = [
    { label: '🔵 Tous',        value: 'TOUS'       },
    { label: '⚽ Football',    value: 'football'   },
    { label: '🎾 Tennis',     value: 'tennis'     },
    { label: '🏓 Padel',      value: 'padel'      },
    { label: '🏀 Basketball', value: 'basketball' },
    { label: '🏐 Volleyball', value: 'volleyball' }
  ];

  constructor(private svc: MatchService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getOuverts().subscribe({
      next: (data) => {
        this.matchs = data;
        this.filtrer(this.filtreSport);
        this.loading = false;
        // Mettre à jour le modal si ouvert
        if (this.matchSelectionne) {
          const updated = data.find(
            m => m.id === this.matchSelectionne!.id);
          if (updated) this.matchSelectionne = updated;
        }
      },
      error: () => { this.loading = false; }
    });
    this.svc.getMesMatchs().subscribe({
      next: (data) => { this.mesMatchs = data; }
    });
  }

  filtrer(sport: string) {
    this.filtreSport = sport;
    this.matchsFiltres = sport === 'TOUS'
      ? this.matchs
      : this.matchs.filter(
          m => m.sport?.toLowerCase() === sport);
  }

  // ✅ Ouvrir le modal
  ouvrirDetail(m: Match) {
    this.matchSelectionne = m;
    this.modalOuvert      = true;
    document.body.style.overflow = 'hidden';
  }

  // ✅ Fermer le modal
  fermerModal() {
    this.modalOuvert      = false;
    this.matchSelectionne = null;
    document.body.style.overflow = '';
  }

  // ✅ Fermer si clic sur backdrop
  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement)
        .classList.contains('modal-backdrop')) {
      this.fermerModal();
    }
  }

  rejoindre(id: string) {
    this.svc.rejoindre(id).subscribe({
      next: () => {
        this.showMsg(
          '✅ Vous avez rejoint le match !', 'success');
        this.load();
      },
      error: (e: any) => {
        this.showMsg(
          e.error?.erreur || '⛔ Erreur', 'error');
      }
    });
  }

  quitter(id: string) {
    if (!confirm('Quitter ce match ?')) return;
    this.svc.quitter(id).subscribe({
      next: () => {
        this.showMsg(
          '✅ Vous avez quitté le match', 'success');
        this.fermerModal();
        this.load();
      },
      error: (e: any) => {
        this.showMsg(
          e.error?.erreur || '⛔ Erreur', 'error');
      }
    });
  }

  annuler(id: string) {
    if (!confirm('Annuler ce match définitivement ?'))
      return;
    this.svc.annuler(id).subscribe({
      next: () => {
        this.showMsg('✅ Match annulé', 'success');
        this.fermerModal();
        this.load();
      },
      error: (e: any) => {
        this.showMsg(
          e.error?.erreur || '⛔ Erreur', 'error');
      }
    });
  }

  private showMsg(msg: string, type: string) {
    this.message     = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  getPct(m: Match): number {
    if (!m.nbJoueursMax) return 0;
    return Math.round(
      m.nbJoueursActuel / m.nbJoueursMax * 100);
  }

  getPlacesAffichees(m: Match): number[] {
    const nb = Math.max(
      0, Math.min(m.placesRestantes || 0, 3));
    return new Array(nb);
  }

  getSportIcon(sport: string): string {
    const icons: any = {
      football: '⚽', tennis: '🎾', padel: '🏓',
      basketball: '🏀', volleyball: '🏐'
    };
    return icons[sport?.toLowerCase()] || '🏟️';
  }

  getNiveauBadge(niveau: string): string {
    const n = niveau?.toLowerCase();
    if (n === 'expert')        return 'badge-red';
    if (n === 'intermediaire') return 'badge-amber';
    return 'badge-green';
  }

  getStatutBadge(statut: string): string {
  if (statut === 'COMPLET')  return 'badge-red';
  if (statut === 'ANNULE')   return 'badge-amber';
  if (statut === 'TERMINE')  return 'badge-purple'; // ✅
  return 'badge-green';
}

  getInitiale(email: string): string {
    return email ? email[0].toUpperCase() : '?';
  }

  // ✅ Initiales depuis email (john@mail.com → JO)
  getInitialesEmail(email: string): string {
    if (!email) return '?';
    const nom = email.split('@')[0];
    return nom.slice(0, 2).toUpperCase();
  }

  // ✅ Nom affiché depuis email
  getNomDepuisEmail(email: string): string {
    if (!email) return 'Joueur';
    return email.split('@')[0]
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // ✅ Index du joueur (créateur = Organisateur)
  getRoleJoueur(
      email: string, match: Match): string {
    return email === match.createurId
      ? '👑 Organisateur' : '👤 Joueur';
  }

  getRoleBadge(
      email: string, match: Match): string {
    return email === match.createurId
      ? 'badge-purple' : 'badge-blue';
  }
  quitterAttente(id: string) {
  if (!confirm(
      'Quitter la liste d\'attente ?')) return;
  this.svc.quitterAttente(id).subscribe({
    next: () => {
      this.showMsg(
        '✅ Vous avez quitté la liste d\'attente',
        'success');
      this.load();
    },
    error: (e: any) => {
      this.showMsg(
        e.error?.erreur || '⛔ Erreur', 'error');
    }
  });
  
}
terminerMatch(id: string) {
  if (!confirm(
      'Terminer ce match ? '
      + 'Tous les joueurs recevront +10 points !'))
    return;

  this.svc.terminerMatch(id).subscribe({
    next: (res: any) => {
      this.showMsg(
        '🏁 Match terminé ! '
        + res.joueursRecompenses
        + ' joueurs ont reçu +10 points !',
        'success');
      this.load();
    },
    error: (e: any) => {
      this.showMsg(
        e.error?.erreur || '⛔ Erreur', 'error');
    }
  });
}
// ✅ Badge position attente
getPositionLabel(pos: number): string {
  if (pos === 1) return '🥇 1er en attente';
  if (pos === 2) return '🥈 2ème en attente';
  if (pos === 3) return '🥉 3ème en attente';
  return `⏳ ${pos}ème en attente`;
}

}