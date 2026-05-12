export interface Remise {
  id?: string;
  seuilHeures: number;
  pourcentageRemise: number;
  description: string;
  parking?: {
    id: string;
    nom?: string;
  };
  isDeleted?: boolean;
  themeVisuel?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
