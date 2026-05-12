package com.smartpark.backend.controller;

import com.smartpark.backend.dto.FideliteResponseDTO;
import com.smartpark.backend.model.Abonnement;
import com.smartpark.backend.repository.UserRepository;
import com.smartpark.backend.security.JwtUtil;
import com.smartpark.backend.service.FideliteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fidelite")
@CrossOrigin(origins = "http://localhost:4200")
public class FideliteController {

    @Autowired private FideliteService fideliteService;
    @Autowired private JwtUtil         jwtUtil;
    @Autowired private UserRepository  userRepository;

    private String getEmail(String authHeader) {
        return jwtUtil.extractEmail(
                authHeader.replace("Bearer ", ""));
    }

    private String getNom(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getNom() != null
                        ? u.getNom() : "Client")
                .orElse("Client");
    }

    // ✅ GET /api/fidelite/mon-profil
    @GetMapping("/mon-profil")
    public ResponseEntity<FideliteResponseDTO> getProfil(
            @RequestHeader("Authorization")
            String auth) {
        String email = getEmail(auth);
        return ResponseEntity.ok(
                fideliteService.getProfil(email));
    }

    // ✅ GET /api/fidelite/reduction
    @GetMapping("/reduction")
    public ResponseEntity<Map<String, Object>>
    calculerReduction(
            @RequestHeader("Authorization") String auth,
            @RequestParam double montant) {
        String email = getEmail(auth);
        return ResponseEntity.ok(
                fideliteService.calculerReduction(
                        email, montant));
    }

    // ✅ POST /api/fidelite/utiliser-points
    @PostMapping("/utiliser-points")
    public ResponseEntity<?> utiliserPoints(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, Object> body) {
        try {
            String email = getEmail(auth);
            String nom   = getNom(email);
            int points   = (Integer) body
                    .get("points");
            double montant = ((Number) body
                    .get("montant")).doubleValue();
            return ResponseEntity.ok(
                    fideliteService.utiliserPoints(
                            email, nom, points, montant));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ POST /api/fidelite/abonnement
    @PostMapping("/abonnement")
    public ResponseEntity<?> souscrire(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        try {
            String email = getEmail(auth);
            String nom   = getNom(email);
            String type  = body.get("type");
            Abonnement ab =
                    fideliteService.souscrireAbonnement(
                            email, nom, type);
            return ResponseEntity.ok(ab);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ GET /api/fidelite/leaderboard
    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>>
    getLeaderboard() {
        return ResponseEntity.ok(
                fideliteService.getLeaderboard());
    }

    // ✅ GET /api/fidelite/stats (admin)
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>>
    getStats() {
        return ResponseEntity.ok(
                fideliteService.getStatsAdmin());
    }

    // ✅ POST /api/fidelite/points-match (interne)
    @PostMapping("/points-match")
    public ResponseEntity<FideliteResponseDTO>
    pointsMatch(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, String> body) {
        String email = getEmail(auth);
        String nom   = getNom(email);
        String titre = body.getOrDefault(
                "titre", "Match SmartPark");
        return ResponseEntity.ok(
                fideliteService.ajouterPointsMatch(
                        email, nom, titre));
    }
}