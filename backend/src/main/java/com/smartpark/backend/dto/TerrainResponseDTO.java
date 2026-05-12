package com.smartpark.backend.dto;

import lombok.Data;
import lombok.Builder;
import java.util.List;

@Data
@Builder
public class TerrainResponseDTO {
    private String id;
    private String nom;
    private String type;
    private int capacite;
    private double tarifHeure;
    private String statut;
    private String description;
    private List<String> equipements;
    private int nbReservations;
    private double tauxOccupation;
}