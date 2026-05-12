package com.smartpark.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationResponseDTO {
    private String  id;
    private String  terrainId;
    private String  terrainNom;
    private String  clientNom;
    private String  clientEmail;
    private String  clientTel;
    private String  dateReservation;
    private String  heureDebut;
    private String  heureFin;
    private double  montantTotal;
    private String  statut;
    private String  notes;
}