package com.smartpark.backend.service;

import com.smartpark.backend.model.Terrain;
import com.smartpark.backend.repository.ReservationRepository;
import com.smartpark.backend.repository.TerrainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class TarifDynamiqueService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TerrainRepository terrainRepository;

    // ✅ Calcule le tarif dynamique
    public Map<String, Object> calculerTarif(
            String terrainId,
            String date,
            String heureDebut) {

        Terrain terrain = terrainRepository.findById(terrainId)
                .orElseThrow(() -> new RuntimeException("Terrain introuvable"));

        double tarifBase = terrain.getTarifHeure();
        double tarifFinal = tarifBase;
        Map<String, Object> details = new HashMap<>();
        double multiplicateur = 1.0;

        LocalDate localDate = LocalDate.parse(date);
        LocalTime localTime = LocalTime.parse(heureDebut);

        // 1. Vérifier heure de pointe (17h - 21h)
        boolean heurePointe = localTime.getHour() >= 17
                && localTime.getHour() < 21;
        if (heurePointe) {
            multiplicateur += 0.5;
            details.put("heurePointe", "+50% (17h-21h)");
        }

        // 2. Vérifier weekend
        DayOfWeek jour = localDate.getDayOfWeek();
        boolean weekend = jour == DayOfWeek.SATURDAY
                || jour == DayOfWeek.SUNDAY;
        if (weekend) {
            multiplicateur += 0.3;
            details.put("weekend", "+30% (Samedi/Dimanche)");
        }

        // 3. Vérifier taux d'occupation du terrain
        long totalRes = reservationRepository
                .findByTerrainId(terrainId).stream()
                .filter(r -> !"ANNULEE".equals(r.getStatut()))
                .count();

        long resConfirmees = reservationRepository
                .findByTerrainId(terrainId).stream()
                .filter(r -> "CONFIRMEE".equals(r.getStatut()))
                .count();

        double tauxOccupation = totalRes > 0
                ? (double) resConfirmees / totalRes * 100 : 0;

        if (tauxOccupation > 70) {
            multiplicateur += 0.2;
            details.put("forteDemande",
                    "+20% (Taux occupation: "
                            + Math.round(tauxOccupation) + "%)");
        } else if (tauxOccupation < 30 && totalRes > 0) {
            multiplicateur -= 0.2;
            details.put("promotion",
                    "-20% (Promotion faible demande)");
        }

        // 4. Calculer tarif final
        tarifFinal = Math.round(tarifBase * multiplicateur * 100.0) / 100.0;

        // 5. Déterminer le niveau
        String niveau;
        String couleur;
        if (multiplicateur >= 1.5) {
            niveau = "TRES_ELEVE";
            couleur = "#ef4444";
        } else if (multiplicateur >= 1.3) {
            niveau = "ELEVE";
            couleur = "#f97316";
        } else if (multiplicateur >= 1.1) {
            niveau = "NORMAL";
            couleur = "#eab308";
        } else if (multiplicateur < 1.0) {
            niveau = "PROMO";
            couleur = "#22c55e";
        } else {
            niveau = "STANDARD";
            couleur = "#3b82f6";
        }

        Map<String, Object> result = new HashMap<>();
        result.put("terrainId", terrainId);
        result.put("terrainNom", terrain.getNom());
        result.put("tarifBase", tarifBase);
        result.put("tarifFinal", tarifFinal);
        result.put("multiplicateur", multiplicateur);
        result.put("economie", tarifFinal < tarifBase
                ? Math.round((tarifBase - tarifFinal) * 100) / 100.0 : 0);
        result.put("supplement", tarifFinal > tarifBase
                ? Math.round((tarifFinal - tarifBase) * 100) / 100.0 : 0);
        result.put("niveau", niveau);
        result.put("couleur", couleur);
        result.put("details", details);
        result.put("date", date);
        result.put("heureDebut", heureDebut);
        result.put("heurePointe", heurePointe);
        result.put("weekend", weekend);
        result.put("tauxOccupation", Math.round(tauxOccupation));

        return result;
    }

    // ✅ Meilleurs créneaux (les moins chers) pour un terrain
    public Map<String, Object> getMeilleursCreneaux(
            String terrainId, String date) {

        int[] heuresDisponibles = {8,9,10,11,12,13,14,15,16,17,18,19,20};
        java.util.List<Map<String, Object>> creneaux = new java.util.ArrayList<>();

        for (int h : heuresDisponibles) {
            String heure = String.format("%02d:00", h);
            Map<String, Object> tarif = calculerTarif(terrainId, date, heure);

            Map<String, Object> creneau = new HashMap<>();
            creneau.put("heure", heure);
            creneau.put("tarifFinal", tarif.get("tarifFinal"));
            creneau.put("niveau", tarif.get("niveau"));
            creneau.put("couleur", tarif.get("couleur"));
            creneau.put("multiplicateur", tarif.get("multiplicateur"));
            creneaux.add(creneau);
        }

        // Trier par tarif croissant
        creneaux.sort((a, b) ->
                Double.compare(
                        (Double) a.get("tarifFinal"),
                        (Double) b.get("tarifFinal")
                )
        );

        Map<String, Object> result = new HashMap<>();
        result.put("terrainId", terrainId);
        result.put("date", date);
        result.put("tousLesCreneaux", creneaux);
        result.put("meilleursCreneaux", creneaux.subList(0,
                Math.min(3, creneaux.size())));

        return result;
    }

    // ✅ Analyse complète de tous les terrains
    public java.util.List<Map<String, Object>> analyseGlobale() {
        java.util.List<Terrain> terrains = terrainRepository.findAll();
        java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();

        String today = LocalDate.now().toString();
        String heureMaintenant = String.format(
                "%02d:00", LocalTime.now().getHour());

        for (Terrain t : terrains) {
            try {
                Map<String, Object> tarif = calculerTarif(
                        t.getId(), today, heureMaintenant);
                result.add(tarif);
            } catch (Exception e) {
                // Ignorer les erreurs
            }
        }

        return result;
    }
}