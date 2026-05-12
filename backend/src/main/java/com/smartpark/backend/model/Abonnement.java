package com.smartpark.backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "abonnements")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Abonnement {

    @Id
    private String id;

    private String email;
    private String nomClient;
    private String type;         // BASIC | PREMIUM | VIP

    // ── VALIDITÉ ────────────────────────────────
    private String dateDebut;
    private String dateFin;
    private boolean actif;

    // ── AVANTAGES ───────────────────────────────
    private int    matchsRestants;  // matchs inclus
    private int    matchsTotal;     // total inclus
    private double reductionPct;    // % de réduction
    private int    pointsBonus;     // points bonus/mois

    private double prixPaye;
    private String createdAt;
}