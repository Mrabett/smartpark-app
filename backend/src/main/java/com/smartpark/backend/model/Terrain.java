package com.smartpark.backend.model;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "terrains")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Terrain {

    @Id
    private String id;
    private String nom;
    private String type;
    private int capacite;
    private double tarifHeure;
    private String statut;
    private String description;
    private List<String> equipements;
}