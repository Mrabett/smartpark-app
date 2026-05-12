export interface HistoryDetail {
  date: string;
  nbVehicules: number;
  total: number;
}

export interface RecetteSummary {
  today: number;
  week: number;
  month: number;
  year: number;
  [key: string]: number;
}

export interface RecetteDTO {
  summary: RecetteSummary;
  history: HistoryDetail[];
}
