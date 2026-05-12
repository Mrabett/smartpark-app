
export enum TypeParking {
  VOITURE = 'VOITURE',
  MOTO = 'MOTO',
  CAMION = 'CAMION',
  BUS = 'BUS',
  VOITURE_HANDICAPE = 'VOITURE_HANDICAPE'
}

export interface Parking {
  id?: string;
  nom: string;
  description?: string;
  typeParking: TypeParking;
  isDeleted: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  tarifDepassement?: number;
  remiseRetard?: number;
  prixInitial: number;
  prixPromos: number;
  dateDebutPromos?: string | Date;
  dateFinPromos?: string | Date;
  isEvent: boolean;
  spots?: any[];
}
