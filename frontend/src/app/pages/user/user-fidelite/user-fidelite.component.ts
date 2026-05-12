import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  FideliteService,
  ProfilFidelite
} from '../../../services/fidelite.service';

@Component({
  selector: 'app-user-fidelite',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './user-fidelite.component.html',
  styleUrl:    './user-fidelite.component.scss'
})
export class UserFideliteComponent implements OnInit {

  profil:      ProfilFidelite | null = null;
  leaderboard: any[]  = [];
  loading      = true;
  onglet       = 'profil';
  message      = '';
  messageType  = 'success';

  // Abonnements disponibles
  abonnements = [
    {
      type:    'BASIC',
      label:   '⭐ Basic',
      prix:    29,
      matchs:  5,
      reduc:   5,
      points:  20,
      couleur: '#3B9EFF',
      avantages: [
        '5 matchs inclus/mois',
        '5% de réduction',
        '+20 points bonus',
        'Accès prioritaire'
      ]
    },
    {
      type:    'PREMIUM',
      label:   '🌟 Premium',
      prix:    49,
      matchs:  10,
      reduc:   15,
      points:  50,
      couleur: '#F5A623',
      avantages: [
        '10 matchs inclus/mois',
        '15% de réduction',
        '+50 points bonus',
        'Support prioritaire',
        'Réservation anticipée'
      ]
    },
    {
      type:    'VIP',
      label:   '💎 VIP',
      prix:    79,
      matchs:  20,
      reduc:   25,
      points:  100,
      couleur: '#A78BFA',
      avantages: [
        '20 matchs inclus/mois',
        '25% de réduction',
        '+100 points bonus',
        'Accès VIP exclusif',
        'Invitations événements',
        'Conseiller dédié'
      ]
    }
  ];

  // Utiliser points
  pointsAUtiliser = 0;
  montantSimulation = 50;
  simulationResult: any = null;

  constructor(private svc: FideliteService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.svc.getProfil().subscribe({
      next: (p) => {
        this.profil  = p;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.svc.getLeaderboard().subscribe({
      next: (l) => { this.leaderboard = l; }
    });
  }

  souscrire(type: string) {
    if (!confirm(
        `Souscrire à l'abonnement ${type} ?`))
      return;

    this.svc.souscrireAbonnement(type).subscribe({
      next: () => {
        this.showMsg(
          '✅ Abonnement activé ! '
          + 'Email de confirmation envoyé.',
          'success');
        this.loadAll();
      },
      error: (e: any) => {
        this.showMsg(
          e.error?.erreur || '⛔ Erreur', 'error');
      }
    });
  }

  simulerReduction() {
    this.svc.calculerReduction(
        this.montantSimulation).subscribe({
      next: (r) => { this.simulationResult = r; }
    });
  }

  utiliserPoints() {
    if (this.pointsAUtiliser <= 0) return;
    this.svc.utiliserPoints(
        this.pointsAUtiliser,
        this.montantSimulation).subscribe({
      next: (r) => {
        this.simulationResult = r;
        this.showMsg(
          '✅ ' + this.pointsAUtiliser
          + ' points utilisés !', 'success');
        this.loadAll();
      },
      error: (e: any) => {
        this.showMsg(
          e.error?.erreur || '⛔ Erreur', 'error');
      }
    });
  }

  getNiveauCouleur(niveau: string): string {
    switch (niveau) {
      case 'SILVER':   return '#8A9BB0';
      case 'GOLD':     return '#F5A623';
      case 'PLATINUM': return '#A78BFA';
      default:         return '#CD7F32';
    }
  }

  getPointsTypeClass(type: string): string {
    if (type === 'GAIN')    return 'pts-gain';
    if (type === 'UTILISE') return 'pts-utilise';
    return 'pts-bonus';
  }

  getCarteSlots(): number[] {
    return Array.from({ length: 10 }, (_, i) => i);
  }

  isSlotActif(index: number): boolean {
    return index < (this.profil
      ?.matchsCarteActuelle || 0);
  }

  private showMsg(msg: string, type: string) {
    this.message     = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 4000);
  }
}