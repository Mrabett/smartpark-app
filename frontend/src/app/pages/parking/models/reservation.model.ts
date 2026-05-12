import { Spot } from './spot.model';

export interface ParkingReservation {
  id?: string;
  matricule: string;
  spot?: Spot | { id: string };
  spotId?: string;
  spotNom?: string;
  parkingId?: string;
  parkingNom?: string;
  montant?: number;
  montantFinal?: number;
  date?: string;
  dateSortie?: string;
  datetimeEntree: string;
  datetimeSortie: string;
  statusAction?: string;
  qrCode?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  tarifDepassement: number;
  remiseRetard: number;
  voitureMarque?: string;
  voitureCouleur?: string;
  voitureModele?: string;
  spontane?: boolean;
  scoreConfiance?: number;
  userId?: string;
  userName?: string;
}
