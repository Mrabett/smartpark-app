package com.smartpark.backend.parking.controller;

import com.smartpark.backend.parking.dto.RecetteDTO;
import com.smartpark.backend.parking.service.IRecetteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recettes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class RecetteController {

    private final IRecetteService recetteService;

    @GetMapping("/admin-stats")
    public ResponseEntity<RecetteDTO> getAdminStats() {
        return ResponseEntity.ok(recetteService.getStatistiquesGlobales());
    }

    @GetMapping("/test")
    public ResponseEntity<String> testRecette() {
        try {
            recetteService.enregistrerSortie(10.0);
            return ResponseEntity.ok("Recette enregistrée avec succès de 10.0 TND");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
