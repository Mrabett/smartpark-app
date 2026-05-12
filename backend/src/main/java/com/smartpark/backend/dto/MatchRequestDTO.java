package com.smartpark.backend.dto;

import lombok.Data;

@Data
public class MatchRequestDTO {
    private String titre;
    private String sport;
    private String format;
    private String niveau;
    private String description;
    private String terrainId;
    private String date;
    private String heure;
    private int nbJoueursMax;
}