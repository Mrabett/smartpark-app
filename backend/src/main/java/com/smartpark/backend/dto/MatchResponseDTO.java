package com.smartpark.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponseDTO {
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
    private int    placesRestantes;
    private String createurId;
    private String createurNom;

    // Joueurs confirmés
    private List<String> joueurs;

    // ✅ NOUVEAU — Liste d'attente
    private List<String> listeAttente;
    private int          nbAttente;
    private int          positionAttente; // position du user courant (0 = pas en attente)

    private String  statut;
    private String  createdAt;
    private boolean estInscrit;
    private boolean estCreateur;

    // ✅ NOUVEAU
    private boolean estEnAttente;
}