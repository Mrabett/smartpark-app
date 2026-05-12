import { Parking } from './parking.model';
import { ParkingReservation } from './reservation.model';

export interface Spot {
  id?: string;
  nom: string;
  description?: string;
  statut?: 'LIBRE' | 'RESERVE' | 'OCCUPE' | 'MAINTENANCE' | string;
  x?: number;
  y?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  parking?: Parking | { id: string };
  reservationList?: ParkingReservation[];
}
