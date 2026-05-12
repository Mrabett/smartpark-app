import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IaService } from '../../../services/ia.service';

@Component({
  selector: 'app-ia-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ia-dashboard.component.html',
  styleUrl:    './ia-dashboard.component.scss'
})
export class IaDashboardComponent implements OnInit {

  sentiments: any    = null;
  loading            = true;

  constructor(private iaSvc: IaService) {}

  ngOnInit() {
    this.iaSvc.getSentiments().subscribe({
      next: (s) => { this.sentiments = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getPct(val: number): number {
    if (!this.sentiments?.total) return 0;
    return Math.round(val / this.sentiments.total * 100);
  }
}