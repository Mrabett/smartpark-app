package com.smartpark.backend.parking.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParkingReservationDTO {
    private String id;

    @NotBlank(message = "Le matricule est obligatoire")
    @Size(min = 4, max = 20, message = "Le matricule doit comporter entre 4 et 20 caractères")
    private String matricule;

    @NotNull(message = "La date d'entrée est obligatoire")
    private LocalDateTime datetimeEntree;

    private LocalDateTime datetimeSortie;

    @PositiveOrZero(message = "Le montant ne peut pas être négatif")
    private double montant;
    private Double montantFinal;
    private String statusAction;
    private String qrCode;
    private String spotId;
    private String spotNom;
    private String parkingId;
    private String parkingNom;
    private double tarifDepassement;
    private double remiseRetard;
    private String voitureMarque;
    private String voitureCouleur;
    private String voitureModele;
    private boolean spontane;
    private double scoreConfiance;
    private String imageEntree;
    private String imageSortie;
    private LocalDateTime heureDetectionIa;
    // Session utilisateur
    private String userId;
    private String userName;
}
