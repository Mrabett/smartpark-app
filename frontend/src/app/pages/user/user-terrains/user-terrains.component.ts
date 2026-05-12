import { Component, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TerrainService, Terrain } from '../../../services/terrain.service';

@Component({
  selector: 'app-user-terrains',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass, FormsModule],
  templateUrl: './user-terrains.component.html',
  styleUrl: './user-terrains.component.scss'
})
export class UserTerrainsComponent implements OnInit {
  terrains: Terrain[] = [];
  terrainsFiltres: Terrain[] = [];
  filtreActif = 'TOUS';
  recherche = '';

  filtres = [
    { label: 'Tous',           value: 'TOUS'       },
    { label: '⚽ Football',    value: 'FOOT'       },
    { label: '🏓 Padel',      value: 'PADEL'      },
    { label: '🎾 Tennis',     value: 'TENNIS'     },
    { label: '🏀 Basketball', value: 'BASKETBALL' }
  ];

  constructor(
    private terrainSvc: TerrainService,
    private router: Router
  ) {}

  ngOnInit() {
    this.terrainSvc.getAll().subscribe(t => {
      this.terrains = t;
      this.appliquerFiltres();
    });
  }

  filtrer(type: string) {
    this.filtreActif = type;
    this.appliquerFiltres();
  }

  appliquerFiltres() {
    let result = this.terrains;
    if (this.filtreActif !== 'TOUS') {
      result = result.filter(t => t.type === this.filtreActif);
    }
    if (this.recherche.trim()) {
      result = result.filter(t =>
        t.nom.toLowerCase().includes(this.recherche.toLowerCase())
      );
    }
    this.terrainsFiltres = result;
  }

  reserver(id: string) {
    this.router.navigate(['/user/reserver', id]);
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
}