package com.smartpark.backend.dto;

import lombok.Data;

@Data
public class ReservationRequestDTO {
    private String terrainId;
    private String clientNom;
    private String clientEmail;
    private String clientTel;
    private String dateReservation;
    private String heureDebut;
    private String heureFin;
    private String notes;
}