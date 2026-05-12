package com.smartpark.backend.service;

import com.smartpark.backend.dto.RecommandationRequestDTO;
import com.smartpark.backend.model.Terrain;
import com.smartpark.backend.repository.ReservationRepository;
import com.smartpark.backend.repository.TerrainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IaRecommandationService {

    @Autowired private TerrainRepository     terrainRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private HuggingFaceService    huggingFaceService;

    // ✅ Recommander les meilleurs terrains
    public List<Map<String, Object>> recommander(
            RecommandationRequestDTO req) {

        List<Terrain> terrains = terrainRepository.findAll()
                .stream()
                .filter(t -> !"MAINTENANCE".equals(t.getStatut()))
                .collect(Collectors.toList());

        List<Map<String, Object>> scored = new ArrayList<>();

        for (Terrain t : terrains) {
            double score = calculerScore(t, req);

            Map<String, Object> item = new HashMap<>();
            item.put("terrain",     t);
            item.put("score",       Math.round(score * 10.0) / 10.0);
            item.put("pourquoi",    genererExplication(t, req, score));
            item.put("compatible",  score >= 60);
            item.put("badgeIA",     genererBadge(score));
            scored.add(item);
        }

        // Trier par score décroissant
        scored.sort((a, b) ->
                Double.compare(
                        (Double) b.get("score"),
                        (Double) a.get("score")
                )
        );

        return scored.stream().limit(3).collect(Collectors.toList());
    }

    // ✅ Calculer le score IA d'un terrain
    private double calculerScore(
            Terrain t, RecommandationRequestDTO req) {
        double score = 50.0;

        // 1. Sport compatible
        if (req.getSport() != null) {
            String type = t.getType() != null
                    ? t.getType().toLowerCase() : "";
            String sport = req.getSport().toLowerCase();
            if (type.contains(sport) || sport.contains(type)) {
                score += 30;
            } else if (sport.equals("football")
                    && type.equals("foot")) {
                score += 30;
            }
        }

        // 2. Budget compatible
        if (req.getBudgetMax() > 0) {
            double tarifH = t.getTarifHeure();
            if (tarifH <= req.getBudgetMax()) {
                double diff = req.getBudgetMax() - tarifH;
                score += Math.min(20, diff / req.getBudgetMax() * 20);
            } else {
                score -= 20;
            }
        }

        // 3. Disponibilité (occupation)
        long totalRes = reservationRepository
                .findByTerrainId(t.getId()).stream()
                .filter(r -> !"ANNULEE".equals(r.getStatut()))
                .count();
        if (totalRes < 5) score += 10;
        else if (totalRes > 20) score -= 5;

        // 4. Statut disponible
        if ("DISPONIBLE".equals(t.getStatut())) score += 10;
        else if ("OCCUPE".equals(t.getStatut()))  score -= 10;

        // 5. Niveau joueur vs tarif
        if (req.getNiveauJoueur() != null) {
            switch (req.getNiveauJoueur().toLowerCase()) {
                case "expert":
                    if (t.getTarifHeure() > 50) score += 5;
                    break;
                case "debutant":
                    if (t.getTarifHeure() < 30) score += 5;
                    break;
            }
        }

        return Math.min(100, Math.max(0, score));
    }

    // ✅ Générer une explication IA
    private String genererExplication(
            Terrain t, RecommandationRequestDTO req,
            double score) {

        List<String> raisons = new ArrayList<>();

        if (req.getSport() != null
                && t.getType() != null
                && t.getType().toLowerCase()
                .contains(req.getSport().toLowerCase())) {
            raisons.add("✅ Parfait pour le " + req.getSport());
        }

        if (req.getBudgetMax() > 0
                && t.getTarifHeure() <= req.getBudgetMax()) {
            raisons.add("💰 Dans votre budget ("
                    + t.getTarifHeure() + " DT/h)");
        }

        if ("DISPONIBLE".equals(t.getStatut())) {
            raisons.add("🟢 Disponible maintenant");
        }

        if (score >= 80) {
            raisons.add("⭐ Recommandé fortement par l'IA");
        }

        return raisons.isEmpty()
                ? "Terrain compatible avec vos critères"
                : String.join(" · ", raisons);
    }

    private String genererBadge(double score) {
        if (score >= 80) return "🏆 Meilleur choix";
        if (score >= 65) return "⭐ Très recommandé";
        if (score >= 50) return "✅ Compatible";
        return "ℹ️ Disponible";
    }

    // ✅ Analyse sentiment des notes de réservation
    public Map<String, Object> analyserAvisClients() {
        List<String> notes = reservationRepository.findAll()
                .stream()
                .filter(r -> r.getNotes() != null
                        && !r.getNotes().isBlank())
                .map(r -> r.getNotes())
                .limit(50)
                .collect(Collectors.toList());

        if (notes.isEmpty()) {
            return Map.of(
                    "positif",  0,
                    "negatif",  0,
                    "neutre",   0,
                    "total",    0,
                    "scoreGlobal", 0.0
            );
        }

        int positif = 0, negatif = 0, neutre = 0;
        double scoreTotal = 0;

        for (String note : notes) {
            Map<String, Object> sentiment =
                    huggingFaceService.analyserSentiment(note);
            String s = (String) sentiment.get("sentiment");
            double sc = ((Number) sentiment.get("score"))
                    .doubleValue();

            switch (s) {
                case "POSITIF": positif++; scoreTotal += sc; break;
                case "NEGATIF": negatif++; break;
                default:        neutre++;  scoreTotal += 0.5;
            }
        }

        double scoreGlobal = notes.isEmpty() ? 0
                : Math.round(scoreTotal / notes.size() * 100.0) / 100.0;

        return Map.of(
                "positif",     positif,
                "negatif",     negatif,
                "neutre",      neutre,
                "total",       notes.size(),
                "scoreGlobal", scoreGlobal,
                "tendance",    positif > negatif ? "POSITIVE" : "NEGATIVE"
        );
    }
}