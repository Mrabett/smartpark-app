package com.smartpark.backend.controller;

import com.smartpark.backend.dto.MatchRequestDTO;
import com.smartpark.backend.dto.MatchResponseDTO;
import com.smartpark.backend.repository.UserRepository;
import com.smartpark.backend.security.JwtUtil;
import com.smartpark.backend.service.FideliteService;
import com.smartpark.backend.service.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matchs")
@CrossOrigin(origins = "http://localhost:4200")
public class MatchController {

    @Autowired private MatchService    matchService;
    @Autowired private JwtUtil         jwtUtil;
    @Autowired private UserRepository  userRepository;

    // ✅ NOUVEAU — Service fidélité
    @Autowired private FideliteService fideliteService;

    // ─── Helpers
    private String getEmail(String authHeader) {
        return jwtUtil.extractEmail(
                authHeader.replace("Bearer ", ""));
    }

    private String getNom(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getNom() != null
                        ? u.getNom() : "Joueur")
                .orElse("Joueur");
    }

    // ✅ POST /api/matchs — Créer un match
    @PostMapping
    public ResponseEntity<?> creer(
            @RequestHeader("Authorization") String auth,
            @RequestBody MatchRequestDTO dto) {
        try {
            String email = getEmail(auth);
            String nom   = getNom(email);
            return ResponseEntity.ok(
                    matchService.creerMatch(dto, email, nom));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ GET /api/matchs — Matchs ouverts
    @GetMapping
    public ResponseEntity<List<MatchResponseDTO>>
    getOuverts(
            @RequestHeader("Authorization") String auth) {
        String email = getEmail(auth);
        return ResponseEntity.ok(
                matchService.getMatchsOuverts(email));
    }

    // ✅ GET /api/matchs/tous — Admin
    @GetMapping("/tous")
    public ResponseEntity<List<MatchResponseDTO>>
    getTous(
            @RequestHeader("Authorization") String auth) {
        String email = getEmail(auth);
        return ResponseEntity.ok(
                matchService.getAllMatchs(email));
    }

    // ✅ GET /api/matchs/mes-matchs
    @GetMapping("/mes-matchs")
    public ResponseEntity<List<MatchResponseDTO>>
    getMesMatchs(
            @RequestHeader("Authorization") String auth) {
        String email = getEmail(auth);
        return ResponseEntity.ok(
                matchService.getMesMatchs(email));
    }

    // ✅ GET /api/matchs/stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(matchService.getStats());
    }

    // ✅ GET /api/matchs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(
            @PathVariable String id,
            @RequestHeader("Authorization") String auth) {
        try {
            String email = getEmail(auth);
            return ResponseEntity.ok(
                    matchService.getById(id, email));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ POST /api/matchs/{id}/rejoindre
    // Points fidélité automatiques quand on rejoint
    @PostMapping("/{id}/rejoindre")
    public ResponseEntity<?> rejoindre(
            @PathVariable String id,
            @RequestHeader("Authorization") String auth) {
        try {
            String email = getEmail(auth);
            String nom   = getNom(email);

            MatchResponseDTO result =
                    matchService.rejoindreMatch(
                            id, email, nom);

            // ✅ POINTS FIDÉLITÉ — rejoindre un match
            // +10 points par match rejoint
            try {
                fideliteService.ajouterPointsMatch(
                        email, nom, result.getTitre());

                System.out.println(
                        "✅ +10 points fidélité pour "
                                + email + " — match "
                                + result.getTitre());

            } catch (Exception e) {
                System.err.println(
                        "⚠️ Points match ignorés: "
                                + e.getMessage());
            }

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ POST /api/matchs/{id}/quitter
    @PostMapping("/{id}/quitter")
    public ResponseEntity<?> quitter(
            @PathVariable String id,
            @RequestHeader("Authorization") String auth) {
        try {
            String email = getEmail(auth);
            return ResponseEntity.ok(
                    matchService.quitterMatch(id, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ PUT /api/matchs/{id}/annuler
    @PutMapping("/{id}/annuler")
    public ResponseEntity<?> annuler(
            @PathVariable String id,
            @RequestHeader("Authorization") String auth) {
        try {
            String email = getEmail(auth);
            return ResponseEntity.ok(
                    matchService.annulerMatch(id, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ PUT /api/matchs/{id}/terminer
    // NOUVEAU — Terminer un match = points à TOUS
    @PutMapping("/{id}/terminer")
    public ResponseEntity<?> terminer(
            @PathVariable String id,
            @RequestHeader("Authorization") String auth) {
        try {
            String email = getEmail(auth);

            // Récupérer le match
            MatchResponseDTO match =
                    matchService.getById(id, email);

            // Seul le créateur peut terminer
            if (!match.isEstCreateur()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("erreur",
                                "Seul le créateur peut "
                                        + "terminer le match !"));
            }

            // ✅ POINTS FIDÉLITÉ — à TOUS les joueurs
            // +10 points pour chaque joueur confirmé
            if (match.getJoueurs() != null) {
                for (String joueurEmail
                        : match.getJoueurs()) {
                    try {
                        String nomJoueur =
                                getNom(joueurEmail);
                        fideliteService
                                .ajouterPointsMatch(
                                        joueurEmail,
                                        nomJoueur,
                                        match.getTitre());

                        System.out.println(
                                "✅ +10 pts pour "
                                        + joueurEmail
                                        + " — match terminé : "
                                        + match.getTitre());

                    } catch (Exception e) {
                        System.err.println(
                                "⚠️ Points ignorés pour "
                                        + joueurEmail + ": "
                                        + e.getMessage());
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message",
                    "Match terminé ! Points distribués "
                            + "à tous les joueurs.",
                    "joueursRecompenses",
                    match.getJoueurs() != null
                            ? match.getJoueurs().size() : 0
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ POST /api/matchs/{id}/quitter-attente
    @PostMapping("/{id}/quitter-attente")
    public ResponseEntity<?> quitterAttente(
            @PathVariable String id,
            @RequestHeader("Authorization") String auth) {
        try {
            String email = getEmail(auth);
            return ResponseEntity.ok(
                    matchService.quitterListeAttente(
                            id, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }
}