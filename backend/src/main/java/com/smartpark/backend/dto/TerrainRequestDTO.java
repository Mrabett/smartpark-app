package com.smartpark.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class TerrainRequestDTO {
    private String nom;
    private String type;
    private int capacite;
    private double tarifHeure;
    private String statut;
    private String description;
    private List<String> equipements;
}