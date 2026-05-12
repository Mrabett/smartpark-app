package com.smartpark.backend.parking.entity;

import lombok.*;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;

@Data
@Document(collection = "parking_reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ParkingReservation {
    private String id;
    private String matricule;

    @DocumentReference
    private Spot spot;

    private double montant;
    private LocalDateTime date;
    private LocalDateTime dateSortie;
    private LocalDateTime datetimeEntree;
    private LocalDateTime datetimeSortie;
    private String statusAction = "ATTENTE";
    private Double montantFinal;
    private String qrCode;
    private Boolean isDeleted = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @DBRef
    private ParkingLot parking;

    private Double tarifDepassement;
    private Double remiseRetard;
    private String voitureMarque;
    private String voitureCouleur;
    private String voitureModele;
    private boolean spontane;
    private Double scoreConfiance;
    private String imageEntree;
    private String imageSortie;
    private LocalDateTime heureDetectionIa;
    // Session utilisateur
    private String userId;
    private String userName;
}
