import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TerrainService, Terrain } from '../../../services/terrain.service';

@Component({
  selector: 'app-terrain-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './terrain-form.component.html',
  styleUrl: './terrain-form.component.scss'
})
export class TerrainFormComponent implements OnInit {
  terrain: Terrain = {
    nom: '', type: 'FOOT', capacite: 0,
    tarifHeure: 0, statut: 'DISPONIBLE',
    description: '', equipements: []
  };
  isEdit = false;
  id = '';
  eqInput = '';
  erreur = '';

  types = [
    { value: 'FOOT',       label: '⚽ Football' },
    { value: 'PADEL',      label: '🏓 Padel' },
    { value: 'TENNIS',     label: '🎾 Tennis' },
    { value: 'BASKETBALL', label: '🏀 Basketball' },
    { value: 'VOLLEYBALL', label: '🏐 Volleyball' }
  ];

  statuts = [
    { value: 'DISPONIBLE',  label: '✅ Disponible' },
    { value: 'OCCUPE',      label: '🔴 Occupé' },
    { value: 'MAINTENANCE', label: '⚙️ Maintenance' }
  ];

  constructor(
    private svc: TerrainService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];
    if (this.id) {
      this.isEdit = true;
      this.svc.getById(this.id).subscribe(d => this.terrain = d);
    }
  }

  addEq() {
    if (this.eqInput.trim()) {
      this.terrain.equipements = [
        ...(this.terrain.equipements || []),
        this.eqInput.trim()
      ];
      this.eqInput = '';
    }
  }

  removeEq(i: number) {
    this.terrain.equipements?.splice(i, 1);
  }

  submit() {
    const action = this.isEdit
      ? this.svc.update(this.id, this.terrain)
      : this.svc.create(this.terrain);
    action.subscribe({
      next: () => this.router.navigate(['/terrains']),
      error: () => this.erreur = 'Erreur lors de la sauvegarde'
    });
  }
}