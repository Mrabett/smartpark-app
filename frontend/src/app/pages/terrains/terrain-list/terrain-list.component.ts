import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TerrainService, Terrain } from '../../../services/terrain.service';

@Component({
  selector: 'app-terrain-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass],
  templateUrl: './terrain-list.component.html',
  styleUrl: './terrain-list.component.scss'
})
export class TerrainListComponent implements OnInit {
  terrains: Terrain[] = [];
  terrainsFiltres: Terrain[] = [];
  filtreActif = 'TOUS';
  message = '';

  filtres = [
    { label: 'Tous',           value: 'TOUS'        },
    { label: '⚽ Football',    value: 'FOOT'        },
    { label: '🏓 Padel',      value: 'PADEL'       },
    { label: '🎾 Tennis',     value: 'TENNIS'      },
    { label: '🏀 Basketball', value: 'BASKETBALL'  }
  ];

  constructor(private terrainService: TerrainService) {}

  ngOnInit() { this.load(); }

  load() {
    this.terrainService.getAll().subscribe({
      next: (data) => {
        this.terrains = data;
        this.filtrer(this.filtreActif);
      }
    });
  }

  filtrer(type: string) {
    this.filtreActif = type;
    this.terrainsFiltres = type === 'TOUS'
      ? this.terrains
      : this.terrains.filter(t => t.type === type);
  }

  delete(id: string) {
    if (confirm('Supprimer ce terrain ?')) {
      this.terrainService.delete(id).subscribe({
        next: () => {
          this.message = '✅ Terrain supprimé !';
          this.load();
          setTimeout(() => this.message = '', 3000);
        }
      });
    }
  }

  // Changer le statut du terrain directement
  changerStatut(t: Terrain) {
    const statuts = ['DISPONIBLE', 'OCCUPE', 'MAINTENANCE'];
    const idx = statuts.indexOf(t.statut || 'DISPONIBLE');
    const newStatut = statuts[(idx + 1) % statuts.length];
    const updated = { ...t, statut: newStatut };
    this.terrainService.update(t.id!, updated).subscribe({
      next: () => {
        this.message = `✅ Statut changé → ${newStatut}`;
        this.load();
        setTimeout(() => this.message = '', 3000);
      }
    });
  }

  getIcon(type: string): string {
    const icons: any = {
      FOOT: '⚽', PADEL: '🏓',
      TENNIS: '🎾', BASKETBALL: '🏀', VOLLEYBALL: '🏐'
    };
    return icons[type] || '🏟️';
  }

  getBgClass(type: string): string {
    const c: any = {
      FOOT: 'bg-foot', PADEL: 'bg-padel',
      TENNIS: 'bg-tennis', BASKETBALL: 'bg-basket'
    };
    return c[type] || 'bg-foot';
  }

  getBadgeClass(statut: string): string {
    if (statut === 'DISPONIBLE') return 'badge-green';
    if (statut === 'OCCUPE')     return 'badge-red';
    return 'badge-amber';
  }
}