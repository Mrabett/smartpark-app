package com.smartpark.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.smartpark.backend.model.Fidelite;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FideliteResponseDTO {

    private String id;
    private String email;
    private String nomClient;

    // Points
    private int    pointsTotal;
    private int    pointsDisponibles;
    private int    pointsUtilises;

    // Niveau
    private String niveau;
    private String niveauIcon;
    private int    pointsProchainNiveau;
    private int    progressionNiveau;  // 0-100%

    // Carte 10 matchs
    private int    matchsJoues;
    private int    matchsCarteActuelle;
    private int    cartesCompletes;
    private int    matchsRestantsCarte; // pour compléter la carte
    private boolean prochainMatchGratuit;

    // Stats
    private double economiesTotal;
    private String createdAt;
    private String lastActivity;

    // Historique
    private List<Fidelite.HistoriquePoint> historique;

    // Abonnement actif
    private AbonnementDTO abonnementActif;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AbonnementDTO {
        private String  type;
        private String  typeLabel;
        private String  dateFin;
        private int     matchsRestants;
        private double  reductionPct;
        private boolean actif;
    }
}