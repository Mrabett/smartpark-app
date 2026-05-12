package com.smartpark.backend.parking.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ParkingLotDTO {
    private String id;

    @NotBlank(message = "Le nom du parking est obligatoire")
    private String nom;

    private String description;
    private String typeParking;

    @Positive(message = "Le prix initial doit être positif")
    private double prixInitial;

    @PositiveOrZero(message = "Le prix promo ne peut pas être négatif")
    private double prixPromos;
    private double tarifDepassement;
    private double remiseRetard;
    
    @com.fasterxml.jackson.annotation.JsonProperty("isEvent")
    private boolean isEvent;
    private LocalDate dateDebutPromos;
    private LocalDate dateFinPromos;
    private List<SpotDTO> spots;
    private List<RemiseDTO> remises;
}
