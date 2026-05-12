import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TarifDynamiqueService } from '../../services/tarif-dynamique.service';
import { TerrainService } from '../../services/terrain.service';

@Component({
  selector: 'app-tarification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tarification.component.html'
})
export class TarificationComponent implements OnInit {

  terrains: any[]       = [];
  analyseGlobale: any[] = [];

  terrainId  = '';
  date       = new Date().toISOString().split('T')[0];
  heureDebut = '09:00';

  tarifResult: any       = null;
  meilleursCreneaux: any = null;
  loading                = false;

  constructor(
    private tarifSvc: TarifDynamiqueService,
    private terrainSvc: TerrainService
  ) {}

  ngOnInit() {
    this.terrainSvc.getAll().subscribe(t => {
      this.terrains = t;
      // ✅ Vérification id non undefined
      if (t.length > 0 && t[0].id) {
        this.terrainId = t[0].id;
      }
    });
    this.loadAnalyse();
  }

  loadAnalyse() {
    this.tarifSvc.getAnalyseGlobale().subscribe(
      a => this.analyseGlobale = a
    );
  }

  calculer() {
    if (!this.terrainId || !this.date || !this.heureDebut) return;
    this.loading = true;
    this.tarifSvc.calculer(
      this.terrainId, this.date, this.heureDebut
    ).subscribe({
      next: (r) => {
        this.tarifResult = r;
        this.loading     = false;
        this.tarifSvc.getMeilleursCreneaux(
          this.terrainId, this.date
        ).subscribe(m => this.meilleursCreneaux = m);
      },
      error: () => this.loading = false
    });
  }

  getNiveauIcon(niveau: string): string {
    const m: any = {
      TRES_ELEVE: '🔥',
      ELEVE:      '📈',
      NORMAL:     '➡️',
      STANDARD:   '✅',
      PROMO:      '🎁'
    };
    return m[niveau] || '➡️';
  }

  getNiveauLabel(niveau: string): string {
    const m: any = {
      TRES_ELEVE: 'Très élevé',
      ELEVE:      'Élevé',
      NORMAL:     'Normal',
      STANDARD:   'Standard',
      PROMO:      'Promotion'
    };
    return m[niveau] || niveau;
  }
  

  getMultiplicateurPct(m: number): number {
    return Math.round((m - 1) * 100);
  }
  countByNiveau(niveau: string): number {
  return this.analyseGlobale.filter(
    t => t.niveau === niveau
  ).length;
}

getRevenuPotentiel(): number {
  return this.analyseGlobale.reduce(
    (sum, t) => sum + (t.tarifFinal * 8), 0
  );
}
}