import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RecetteService } from '../../../../../services/recette.service';
import { RecetteDTO, HistoryDetail } from '../../../models/recette.model';

@Component({
  selector: 'app-recette',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './recette.component.html',
  styleUrls: ['./recette.component.css']
})
export class RecetteComponent implements OnInit {
  stats?: RecetteDTO;
  filteredHistory: HistoryDetail[] = [];
  filtreActuel: string = 'journalier';

  constructor(private recetteService: RecetteService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.recetteService.getAdminStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.applyFilter('journalier');
      },
      error: (err) => console.error('Erreur API:', err)
    });
  }

  applyFilter(type: string) {
    this.filtreActuel = type;
    if (!this.stats || !this.stats.history) return;

    const now = new Date();
    this.filteredHistory = this.stats.history.filter(item => {
      const itemDate = new Date(item.date);
      if (type === 'journalier') return true;
      if (type === 'mensuel') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      }
      if (type === 'annuel') {
        return itemDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }
}