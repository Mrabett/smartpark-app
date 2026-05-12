package com.smartpark.backend.controller;

import com.smartpark.backend.service.TarifDynamiqueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tarifs")
@CrossOrigin(origins = "http://localhost:4200")
public class TarifDynamiqueController {

    @Autowired
    private TarifDynamiqueService tarifService;

    // Calculer le tarif pour un terrain/date/heure
    @GetMapping("/calculer")
    public Map<String, Object> calculer(
            @RequestParam String terrainId,
            @RequestParam String date,
            @RequestParam String heureDebut) {
        return tarifService.calculerTarif(terrainId, date, heureDebut);
    }

    // Obtenir les meilleurs créneaux pour un terrain
    @GetMapping("/meilleurs-creneaux")
    public Map<String, Object> getMeilleursCreneaux(
            @RequestParam String terrainId,
            @RequestParam String date) {
        return tarifService.getMeilleursCreneaux(terrainId, date);
    }

    // Analyse globale de tous les terrains
    @GetMapping("/analyse-globale")
    public List<Map<String, Object>> analyseGlobale() {
        return tarifService.analyseGlobale();
    }
}