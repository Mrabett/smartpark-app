package com.smartpark.backend.model;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalTime;

@Document(collection = "reservations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    private String id;

    private String terrainId;
    private String terrainNom;

    private String clientNom;
    private String clientEmail;
    private String clientTel;

    private LocalDate dateReservation;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    private double montantTotal;
    private String statut;
    private String notes;
    private boolean pointsDistribues = false;
    private boolean reservationDiscountUsed = false;
}