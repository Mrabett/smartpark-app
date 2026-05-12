import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TerrainService } from '../../services/terrain.service';
import { ReservationService } from '../../services/reservation.service';
import { TarifDynamiqueService } from '../../services/tarif-dynamique.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  // Stats
  totalTerrains          = 0;
  terrainsDisponibles    = 0;
  terrainsOccupes        = 0;
  terrainsMaintenance    = 0;
  totalReservations      = 0;
  reservationsConfirmees = 0;
  totalRevenus           = 0;

  // Data
  reservations: any[]    = [];
  allReservations: any[] = [];
  terrains: any[]        = [];
  occupationMap: any     = {};
  tarifResume: any[]     = [];

  // Planning
  heures       = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  heuresLabels = ['08h','09h','10h','11h','12h','13h','14h','15h','16h','17h'];
  currentHour  = new Date().getHours();
  isToday      = true;

  selectedDateISO = new Date().toISOString().split('T')[0];
  selectedDate    = '';

  today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  constructor(
    private terrainService: TerrainService,
    private reservationService: ReservationService,
    private tarifSvc: TarifDynamiqueService,
    private router: Router
  ) {}

  ngOnInit() {
    this.updateSelectedDateLabel();
    this.loadData();
  }

  loadData() {
    this.terrainService.getAll().subscribe({
      next: (t) => {
        this.terrains            = t;
        this.totalTerrains       = t.length;
        this.terrainsDisponibles = t.filter(x => x.statut === 'DISPONIBLE').length;
        this.terrainsOccupes     = t.filter(x => x.statut === 'OCCUPE').length;
        this.terrainsMaintenance = t.filter(x => x.statut === 'MAINTENANCE').length;

        this.reservationService.getAll().subscribe({
          next: (r) => {
            this.allReservations        = r;
            this.reservations           = [...r]
              .sort((a, b) =>
                new Date(b.dateReservation).getTime() -
                new Date(a.dateReservation).getTime()
              ).slice(0, 5);
            this.totalReservations      = r.length;
            this.reservationsConfirmees = r.filter(
              x => x.statut === 'CONFIRMEE').length;
            this.totalRevenus = Math.round(
              r.filter(x => x.statut === 'CONFIRMEE')
               .reduce((sum, x) => sum + (x.montantTotal || 0), 0)
            );
            t.forEach(terrain => {
              if (!terrain.id) return;
              const res        = r.filter(x => x.terrainId === terrain.id);
              const confirmees = res.filter(x => x.statut === 'CONFIRMEE').length;
              this.occupationMap[terrain.id] = res.length > 0
                ? Math.round(confirmees / res.length * 100) : 0;
            });
          },
          error: (err) => console.error('Erreur réservations:', err)
        });

        // Tarifs
        this.tarifSvc.getAnalyseGlobale().subscribe({
          next: (a) => {
            this.tarifResume = [...a]
              .sort((x, y) => y.tarifFinal - x.tarifFinal)
              .slice(0, 3);
          },
          error: () => {}
        });
      },
      error: (err) => console.error('Erreur terrains:', err)
    });
  }

  // ===== PLANNING =====
  updateSelectedDateLabel() {
    const d = new Date(this.selectedDateISO + 'T00:00:00');
    this.selectedDate = d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: '2-digit',
      month: 'long', year: 'numeric'
    });
    const todayStr = new Date().toISOString().split('T')[0];
    this.isToday   = this.selectedDateISO === todayStr;
  }

  changeDate(delta: number) {
    const d = new Date(this.selectedDateISO + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    this.selectedDateISO = d.toISOString().split('T')[0];
    this.updateSelectedDateLabel();
  }

  resetToday() {
    this.selectedDateISO = new Date().toISOString().split('T')[0];
    this.updateSelectedDateLabel();
  }

  onDateChange(event: any) {
    this.selectedDateISO = event.target.value;
    this.updateSelectedDateLabel();
  }

  getSlotData(terrainId: string | undefined, heure: number): any {
    if (!terrainId) return { occupied: false };

    const terrain = this.terrains.find(t => t.id === terrainId);
    if (terrain?.statut === 'MAINTENANCE') {
      return {
        occupied: true, isMaintenance: true,
        clientInitials: '⚙', isStart: true, heureDebut: ''
      };
    }

    const res = this.allReservations.find(r => {
      if (r.terrainId !== terrainId)                    return false;
      if (r.statut    === 'ANNULEE')                    return false;
      if (r.dateReservation !== this.selectedDateISO)   return false;

      const debut = parseInt(
        (r.heureDebut || '00:00').toString().split(':')[0], 10);
      const finH  = parseInt(
        (r.heureFin   || '00:00').toString().split(':')[0], 10);
      const finM  = parseInt(
        (r.heureFin   || '00:00').toString().split(':')[1] || '0', 10);
      const fin   = finM > 0 ? finH + 1 : finH;

      return debut <= heure && heure < fin;
    });

    if (res) {
      const debutH  = parseInt(
        (res.heureDebut || '00').toString().split(':')[0], 10);
      const isStart = debutH === heure;
      const initials = (res.clientNom || '?')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return {
        occupied: true, isStart,
        clientInitials: initials,
        clientNom:      res.clientNom,
        heureDebut:     res.heureDebut,
        heureFin:       res.heureFin,
        montant:        res.montantTotal,
        isMaintenance:  false
      };
    }

    return { occupied: false };
  }

  getSlotClass(terrainId: string | undefined, heure: number): string {
    const data    = this.getSlotData(terrainId, heure);
    const terrain = this.terrains.find(t => t.id === terrainId);

    if (terrain?.statut === 'MAINTENANCE') return 'slot maintenance';
    if (!data.occupied) {
      if (this.isToday && heure < this.currentHour)  return 'slot past';
      if (this.isToday && heure === this.currentHour) return 'slot current-time';
      return 'slot free';
    }
    if (data.isStart) return 'slot busy start';
    return 'slot busy continue';
  }

  getSlotTooltip(terrainId: string | undefined, heure: number): string {
    const data = this.getSlotData(terrainId, heure);
    if (!data.occupied)       return `Créneau libre à ${heure}h — Cliquer pour réserver`;
    if (data.isMaintenance)   return 'En maintenance';
    return `${data.clientNom} · ${data.heureDebut}→${data.heureFin} · ${data.montant} DT`;
  }

  onSlotClick(terrain: any, heure: number) {
    const data = this.getSlotData(terrain.id, heure);
    if (!data.occupied && terrain.statut !== 'MAINTENANCE') {
      const h    = String(heure).padStart(2, '0') + ':00';
      const hFin = String(heure + 1).padStart(2, '0') + ':00';
      this.router.navigate(['/reservations/nouvelle'], {
        queryParams: {
          terrainId:  terrain.id,
          date:       this.selectedDateISO,
          heureDebut: h,
          heureFin:   hFin
        }
      });
    }
  }

  getTotalReservationsDay(): number {
    return this.allReservations.filter(r =>
      r.dateReservation === this.selectedDateISO &&
      r.statut !== 'ANNULEE'
    ).length;
  }

  getTotalFreeSlotsDay(): number {
    const total    = this.terrains.length * this.heures.length;
    const occupied = this.terrains.reduce((sum, t) => {
      return sum + this.heures.filter(h =>
        this.getSlotData(t.id, h).occupied
      ).length;
    }, 0);
    return total - occupied;
  }

  getRevenuJour(): number {
    return this.allReservations
      .filter(r =>
        r.dateReservation === this.selectedDateISO &&
        r.statut === 'CONFIRMEE'
      )
      .reduce((sum: number, r: any) => sum + (r.montantTotal || 0), 0);
  }

  // ===== TARIFICATION =====
  getNiveauIcon(niveau: string): string {
    const m: any = {
      TRES_ELEVE: '🔥', ELEVE: '📈',
      NORMAL: '➡️', STANDARD: '✅', PROMO: '🎁'
    };
    return m[niveau] || '➡️';
  }

  getNiveauLabel(niveau: string): string {
    const m: any = {
      TRES_ELEVE: 'Très élevé', ELEVE: 'Élevé',
      NORMAL: 'Normal', STANDARD: 'Standard', PROMO: 'Promotion'
    };
    return m[niveau] || niveau;
  }

  // ===== HELPERS =====
  getTauxOccupation(): number {
    if (this.totalTerrains === 0) return 0;
    return Math.round(this.terrainsOccupes / this.totalTerrains * 100);
  }

  getOccupationTerrain(id: string | undefined): number {
    if (!id) return 0;
    return this.occupationMap[id] || 0;
  }

  getIcon(type: string): string {
    const icons: any = {
      FOOT: '⚽', PADEL: '🏓',
      TENNIS: '🎾', BASKETBALL: '🏀', VOLLEYBALL: '🏐'
    };
    return icons[type] || '🏟️';
  }

  getBadgeClass(statut: string): string {
    if (statut === 'CONFIRMEE') return 'badge-green';
    if (statut === 'ANNULEE')   return 'badge-red';
    return 'badge-amber';
  }

  getTerrainBadge(statut: string): string {
    if (statut === 'DISPONIBLE') return 'badge-green';
    if (statut === 'OCCUPE')     return 'badge-red';
    return 'badge-amber';
  }

  getBarColor(statut: string): string {
    if (statut === 'DISPONIBLE') return 'bar-green';
    if (statut === 'OCCUPE')     return 'bar-red';
    return 'bar-amber';
  }

  getInitials(nom: string): string {
    if (!nom) return '?';
    return nom.split(' ')
              .map((n: string) => n[0])
              .join('').toUpperCase().slice(0, 2);
  }
}