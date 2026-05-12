package com.smartpark.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "fidelite")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fidelite {

    @Id
    private String id;

    private String email;        // email du client
    private String nomClient;

    // ── POINTS ─────────────────────────────────
    private int pointsTotal;     // points cumulés
    private int pointsDisponibles; // points utilisables
    private int pointsUtilises;

    // ── NIVEAU ─────────────────────────────────
    // BRONZE → SILVER → GOLD → PLATINUM
    private String niveau;

    // ── CARTE 10 MATCHS ─────────────────────────
    private int matchsJoues;     // total matchs joués
    private int matchsCarteActuelle; // dans la carte courante (0-10)
    private int cartesCompletes; // nb de cartes complétées

    // ── HISTORIQUE ─────────────────────────────
    private List<HistoriquePoint> historique
            = new ArrayList<>();

    // ── STATS ───────────────────────────────────
    private double economiesTotal; // DT économisés
    private String createdAt;
    private String lastActivity;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoriquePoint {
        private String date;
        private String type;        // GAIN | UTILISE | BONUS
        private int    points;
        private String description;
        private String source;      // MATCH | RESERVATION | BONUS
    }
}