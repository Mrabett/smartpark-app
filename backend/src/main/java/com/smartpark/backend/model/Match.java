package com.smartpark.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "matchs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @Id
    private String id;

    private String titre;
    private String sport;
    private String format;
    private String niveau;
    private String description;
    private String terrainId;
    private String terrainNom;
    private String date;
    private String heure;
    private int    nbJoueursMax;
    private int    nbJoueursActuel;
    private boolean pointsDistribues = false;


    private String createurId;
    private String createurNom;

    // ✅ Joueurs confirmés
    private List<String> joueurs = new ArrayList<>();

    // ✅ NOUVEAU — Liste d'attente
    private List<String> listeAttente = new ArrayList<>();

    private String statut;   // OUVERT, COMPLET, ANNULE
    private String createdAt;
}