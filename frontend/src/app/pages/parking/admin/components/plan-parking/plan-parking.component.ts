import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; 
import { MatButtonModule } from '@angular/material/button';
import { MatCommonModule } from '@angular/material/core'; 
import { SpotService } from '../../../../../services/spot.service';
import { Spot } from '../../../models/spot.model';

@Component({
  selector: 'app-plan-parking',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCommonModule
  ],
  templateUrl: './plan-parking.component.html',
  styleUrls: ['./plan-parking.component.css']
})
export class PlanParkingComponent implements OnInit {
  imagePreview: string | null = null;
  spots: Spot[] = [];
  
  constructor(private spotService: SpotService) {}

  ngOnInit(): void {}

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // 🟢 LA FONCTION QUI MANQUAIT :
  onMapClick(event: MouseEvent) {
    if (!this.imagePreview) return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    // Calcul de la position en % par rapport à l'image
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newSpot: Spot = {
      nom: 'P' + (this.spots.length + 1),
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(y.toFixed(2)),
      statut: 'LIBRE'
    };

    this.spots.push(newSpot);
    console.log("Spot ajouté localement aux coordonnées :", x, y);
  }

calculatePosition(x: number | undefined, y: number | undefined) {
    return {
      'left': (x || 0) + '%',
      'top': (y || 0) + '%',
      'transform': 'translate(-50%, -50%)',
      'position': 'absolute'
    };
  }
}