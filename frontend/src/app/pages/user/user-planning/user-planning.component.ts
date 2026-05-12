import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { FormsModule }                  from '@angular/forms';
import { ReservationService }           from '../../../services/reservation.service';
import { TerrainService }               from '../../../services/terrain.service';

@Component({
  selector:    'app-user-planning',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './user-planning.component.html',
  styleUrl:    './user-planning.component.scss'
})
export class UserPlanningComponent implements OnInit, OnDestroy {

  // ── Données ───────────────────────────────────────────────
  terrains:        any[] = [];
  terrainsFiltres: any[] = [];
  reservations:    any[] = [];
  loading                = false;

  // ── Date & filtre ─────────────────────────────────────────
  dateSelectionnee = new Date().toISOString().split('T')[0];
  terrainFiltre    = 'TOUS';

  // ── Grille ────────────────────────────────────────────────
  heures          = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  heuresDisponibles = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  heureActuelle    = new Date().getHours();
  minutesActuelles = new Date().getMinutes();

  // ⚠️ Ces valeurs DOIVENT correspondre exactement au SCSS ($slot-w et $terrain-col-w)
  readonly SLOT_W         = 70;   // px — même valeur que $slot-w dans le SCSS
  readonly TERRAIN_COL_W  = 220;  // px — même valeur que $terrain-col-w dans le SCSS

  // ── Hover ────────────────────────────────────────────────
  hoveredCreneau: { terrainId: string; heure: number } | null = null;

  // ── Modal ────────────────────────────────────────────────
  showModal           = false;
  terrainSelectionne: any = null;
  heureDebutModal     = '09:00';
  heureFinModal       = '10:00';
  montantEstime       = 0;
  conflitHoraire      = false;
  erreurReservation   = '';
  loadingReservation  = false;

  nouvelleRes = { clientNom: '', clientEmail: '', clientTel: '' };

  // ── Toast ────────────────────────────────────────────────
  toastVisible = false;
  toastMessage = '';

  private timer: any;

  constructor(
    private reservationSvc: ReservationService,
    private terrainSvc:     TerrainService
  ) {}

  // ─────────────────────────────────────────────────────────
  ngOnInit() {
    this.chargerDonnees();
    // Mettre à jour l'heure toutes les minutes
    this.timer = setInterval(() => {
      this.heureActuelle    = new Date().getHours();
      this.minutesActuelles = new Date().getMinutes();
    }, 60_000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ── Chargement ────────────────────────────────────────────
  chargerDonnees() {
    this.loading = true;
    this.terrainSvc.getAll().subscribe({
      next: (data: any[]) => {
        this.terrains = data;
        this.appliquerFiltreTerrain();
        this.chargerReservations();
      },
      error: () => (this.loading = false)
    });
  }

  chargerReservations() {
    this.reservationSvc.getAll().subscribe({
      next: (data: any[]) => {
        this.reservations = data.filter(
          (r: any) =>
            r.dateReservation === this.dateSelectionnee &&
            r.statut !== 'ANNULEE'
        );
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  // ── Navigation date ───────────────────────────────────────
  changerJour(delta: number) {
    const d = new Date(this.dateSelectionnee);
    d.setDate(d.getDate() + delta);
    this.dateSelectionnee = d.toISOString().split('T')[0];
    this.onDateChange();
  }

  onDateChange() {
    this.loading = true;
    this.chargerReservations();
  }

  isAujourdhui(): boolean {
    return this.dateSelectionnee === new Date().toISOString().split('T')[0];
  }

  getJourLabel(): string {
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    if (this.dateSelectionnee === fmt(new Date()))                        return "Aujourd'hui";
    if (this.dateSelectionnee === fmt(new Date(Date.now() + 86_400_000))) return 'Demain';
    if (this.dateSelectionnee === fmt(new Date(Date.now() - 86_400_000))) return 'Hier';
    return '';
  }

  formatDate(d: string): string {
    // Correction : on force le timezone local pour éviter le décalage d'un jour
    const [y, m, day] = d.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  // ── Filtres ───────────────────────────────────────────────
  filtrerTerrain(id: string) {
    this.terrainFiltre = id;
    this.appliquerFiltreTerrain();
  }

  appliquerFiltreTerrain() {
    this.terrainsFiltres =
      this.terrainFiltre === 'TOUS'
        ? this.terrains
        : this.terrains.filter(t => t.id === this.terrainFiltre);
  }

  // ── Créneaux ─────────────────────────────────────────────
  getReservationDuCreneau(terrainId: string, heure: number): any | null {
    return this.reservations.find((r: any) => {
      if (r.terrainId !== terrainId) return false;
      const debut = this.parseHeure(r.heureDebut);
      const fin   = this.parseHeure(r.heureFin);
      return debut <= heure && heure < fin;
    }) ?? null;
  }

  getReservationsDuTerrain(terrainId: string): any[] {
    return this.reservations.filter((r: any) => r.terrainId === terrainId);
  }

  /**
   * Retourne les classes CSS pour un créneau.
   * Les noms doivent correspondre EXACTEMENT aux classes définies dans le SCSS.
   */
  getCreneauClass(terrainId: string, heure: number): string {
    const terrain = this.terrains.find(t => t.id === terrainId);
    const classes: string[] = [];

    if (terrain?.statut === 'MAINTENANCE') {
      classes.push('creneau-maintenance');
      return classes.join(' ');
    }

    if (this.isAujourdhui() && heure < this.heureActuelle) {
      classes.push('creneau-passe');
    } else if (this.isSelectionne(terrainId, heure)) {
      classes.push('creneau-selectionne');
    } else if (this.getReservationDuCreneau(terrainId, heure)) {
      classes.push('creneau-occupe');
    } else {
      classes.push('creneau-libre');
    }

    if (this.isAujourdhui() && heure === this.heureActuelle) {
      classes.push('creneau-maintenant');
    }

    return classes.join(' ');
  }

  isSelectionne(terrainId: string, heure: number): boolean {
    if (!this.terrainSelectionne || this.terrainSelectionne.id !== terrainId) return false;
    const debut = this.parseHeure(this.heureDebutModal);
    const fin   = this.parseHeure(this.heureFinModal);
    return debut <= heure && heure < fin;
  }

  getCreneauTooltip(terrainId: string, heure: number): string {
    const res = this.getReservationDuCreneau(terrainId, heure);
    if (res) return `${res.clientNom} · ${res.heureDebut} → ${res.heureFin}`;
    if (this.isAujourdhui() && heure < this.heureActuelle) return 'Heure passée';
    return `Libre · ${heure}h00 — cliquer pour réserver`;
  }

  // ── Barres de réservation ─────────────────────────────────
  getBarLeftPx(res: any): number {
    const debut = this.parseHeure(res.heureDebut);
    const minH  = Math.min(...this.heures);
    return (debut - minH) * this.SLOT_W;
  }

  getBarWidthPx(res: any): number {
    const debut = this.parseHeure(res.heureDebut);
    const fin   = this.parseHeure(res.heureFin);
    return Math.max(1, fin - debut) * this.SLOT_W - 2;
  }

  // ── Indicateur heure actuelle ─────────────────────────────
  /**
   * Position de la ligne dans la zone des créneaux (sans l'offset du terrain-col).
   */
  getPositionHeureActuelle(): number {
    const minH   = Math.min(...this.heures);
    const offset = (this.heureActuelle - minH) + (this.minutesActuelles / 60);
    return offset * this.SLOT_W;
  }

  /**
   * Position du label global (avec offset de la colonne terrain).
   */
  getPositionHeureActuelleGlobal(): number {
    return this.TERRAIN_COL_W + this.getPositionHeureActuelle();
  }

  getMinutesFormatted(): string {
    return this.minutesActuelles.toString().padStart(2, '0');
  }

  // ── Clic sur créneau ─────────────────────────────────────
  onCreneauClick(terrain: any, heure: number) {
    // Ne rien faire si non réservable
    if (terrain.statut === 'MAINTENANCE')                    return;
    if (this.isAujourdhui() && heure < this.heureActuelle)   return;
    if (this.getReservationDuCreneau(terrain.id, heure))     return;

    // Pré-remplir le modal
    this.terrainSelectionne  = terrain;
    this.heureDebutModal     = `${String(heure).padStart(2, '0')}:00`;
    this.heureFinModal       = `${String(Math.min(heure + 1, 23)).padStart(2, '0')}:00`;
    this.erreurReservation   = '';
    this.conflitHoraire      = false;
    this.nouvelleRes         = { clientNom: '', clientEmail: '', clientTel: '' };
    this.recalculerMontant();
    this.showModal           = true;
  }

  // ── Modal ────────────────────────────────────────────────
  recalculerMontant() {
    const debut = this.parseHeure(this.heureDebutModal);
    const fin   = this.parseHeure(this.heureFinModal);
    const duree = fin - debut;

    if (duree <= 0 || !this.terrainSelectionne) {
      this.montantEstime = 0;
      return;
    }

    this.montantEstime  = Math.round(duree * this.terrainSelectionne.tarifHeure);
    this.conflitHoraire = false;

    // Vérifier conflit
    for (let h = debut; h < fin; h++) {
      if (this.getReservationDuCreneau(this.terrainSelectionne.id, h)) {
        this.conflitHoraire = true;
        break;
      }
    }
  }

  getHeureDebutNum(): number {
    return this.parseHeure(this.heureDebutModal);
  }

  isHeureDisponible(terrainId: string | undefined, heure: number): boolean {
    if (!terrainId) return true;
    if (this.isAujourdhui() && heure < this.heureActuelle) return false;
    return !this.getReservationDuCreneau(terrainId, heure);
  }

  fermerModal() {
    this.showModal          = false;
    this.terrainSelectionne = null;
    this.erreurReservation  = '';
    this.conflitHoraire     = false;
  }

  confirmerReservation() {
    const { clientNom, clientEmail, clientTel } = this.nouvelleRes;

    if (!clientNom.trim() || !clientEmail.trim() || !clientTel.trim()) {
      this.erreurReservation = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    if (this.conflitHoraire) return;

    this.loadingReservation = true;
    this.erreurReservation  = '';

    const payload = {
      terrainId:       this.terrainSelectionne.id,
      clientNom,
      clientEmail,
      clientTel,
      dateReservation: this.dateSelectionnee,
      heureDebut:      this.heureDebutModal,
      heureFin:        this.heureFinModal,
      montantTotal:    this.montantEstime
    };

    this.reservationSvc.create(payload as any).subscribe({
      next: () => {
        this.loadingReservation = false;
        const nomTerrain = this.terrainSelectionne?.nom;
        this.fermerModal();
        this.chargerReservations();
        this.afficherToast(
          `${nomTerrain} · ${payload.heureDebut} → ${payload.heureFin} · ${this.montantEstime} DT`
        );
      },
      error: (e: any) => {
        this.loadingReservation = false;
        this.erreurReservation  = e?.error?.erreur ?? '⛔ Ce créneau est déjà réservé.';
      }
    });
  }

  afficherToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 4000);
  }

  // ── Helpers ───────────────────────────────────────────────
  parseHeure(h: string): number {
    if (!h) return 0;
    return parseInt(h.toString().split(':')[0], 10);
  }

  getInitiales(nom: string): string {
    if (!nom) return '?';
    return nom.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getIcon(type: string): string {
    const map: Record<string, string> = {
      FOOT: '⚽', PADEL: '🏓', TENNIS: '🎾',
      BASKETBALL: '🏀', BASKET: '🏀',
      VOLLEYBALL: '🏐', VOLLEY: '🏐'
    };
    return map[type] ?? '🏟️';
  }

  getBgClass(type: string): string {
    const map: Record<string, string> = {
      FOOT: 'bg-foot', PADEL: 'bg-padel', TENNIS: 'bg-tennis',
      BASKETBALL: 'bg-basket', BASKET: 'bg-basket',
      VOLLEYBALL: 'bg-volley', VOLLEY: 'bg-volley'
    };
    return map[type] ?? 'bg-foot';
  }

  getStatutClass(statut: string): string {
    if (statut === 'DISPONIBLE')   return 'statut-dispo';
    if (statut === 'OCCUPE')       return 'statut-occupe';
    return 'statut-maintenance';
  }

  getBadgeClass(statut?: string): string {
    if (statut === 'CONFIRMEE') return 'badge-green';
    if (statut === 'ANNULEE')   return 'badge-red';
    return 'badge-amber';
  }
}