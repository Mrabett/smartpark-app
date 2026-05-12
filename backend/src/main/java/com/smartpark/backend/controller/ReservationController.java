package com.smartpark.backend.controller;

import com.smartpark.backend.dto.ReservationRequestDTO;
import com.smartpark.backend.dto.ReservationResponseDTO;
import com.smartpark.backend.service.FideliteService;
import com.smartpark.backend.service.ReservationService;
import com.smartpark.backend.security.JwtUtil;
import com.smartpark.backend.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:4200")
public class ReservationController {

    @Autowired private ReservationService reservationService;
    @Autowired private JwtUtil            jwtUtil;
    @Autowired private UserRepository     userRepository;

    // ✅ NOUVEAU — Service fidélité
    @Autowired private FideliteService fideliteService;

    // ─── Helper : récupérer le nom depuis email
    private String getNom(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getNom() != null
                        ? u.getNom() : "Client")
                .orElse("Client");
    }

    // ✅ GET ALL — Admin
    @GetMapping
    public List<ReservationResponseDTO> getAll() {
        return reservationService.getAllReservations();
    }

    // ✅ GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponseDTO> getById(
            @PathVariable String id) {
        return reservationService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ CREATE — Points fidélité automatiques
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody ReservationRequestDTO dto) {
        try {
            ReservationResponseDTO result =
                    reservationService.createReservation(dto);

            // ✅ POINTS FIDÉLITÉ — dès la réservation
            // +5 points + 1 point par tranche de 10 DT
            try {
                String nomClient = getNom(
                        dto.getClientEmail());
                fideliteService
                        .ajouterPointsReservation(
                                dto.getClientEmail(),
                                nomClient,
                                result.getMontantTotal(),
                                result.getTerrainNom());

                System.out.println(
                        "✅ Points fidélité ajoutés pour "
                                + dto.getClientEmail()
                                + " — réservation "
                                + result.getTerrainNom());

            } catch (Exception e) {
                // Ne pas bloquer la réservation
                // si le service fidélité échoue
                System.err.println(
                        "⚠️ Points fidélité ignorés: "
                                + e.getMessage());
            }

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", e.getMessage()));
        }
    }

    // ✅ ANNULER
    @PutMapping("/{id}/annuler")
    public ResponseEntity<ReservationResponseDTO> annuler(
            @PathVariable String id) {
        return ResponseEntity.ok(
                reservationService.annuler(id));
    }

    // ✅ CONFIRMER — Points bonus si confirmée
    @PutMapping("/{id}/confirmer")
    public ResponseEntity<ReservationResponseDTO> confirmer(
            @PathVariable String id) {

        ReservationResponseDTO result =
                reservationService.confirmer(id);

        // ✅ POINTS BONUS — quand admin confirme
        // +3 points bonus de confirmation
        try {
            if (result.getClientEmail() != null) {
                String nomClient = getNom(
                        result.getClientEmail());
                fideliteService
                        .ajouterPointsReservation(
                                result.getClientEmail(),
                                nomClient,
                                3.0,  // petit bonus confirmation
                                "Bonus confirmation — "
                                        + result.getTerrainNom());

                System.out.println(
                        "✅ Bonus confirmation pour "
                                + result.getClientEmail());
            }
        } catch (Exception e) {
            System.err.println(
                    "⚠️ Bonus confirmation ignoré: "
                            + e.getMessage());
        }

        return ResponseEntity.ok(result);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable String id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }

    // ✅ GET BY TERRAIN
    @GetMapping("/terrain/{terrainId}")
    public List<ReservationResponseDTO> getByTerrain(
            @PathVariable String terrainId) {
        return reservationService.getByTerrain(terrainId);
    }

    // ✅ MES RÉSERVATIONS (JWT)
    @GetMapping("/mes-reservations")
    public ResponseEntity<List<ReservationResponseDTO>>
    getMesReservations(
            @RequestHeader("Authorization")
            String authHeader) {
        try {
            String token = authHeader
                    .replace("Bearer ", "");
            String email = jwtUtil.extractEmail(token);

            List<ReservationResponseDTO> reservations =
                    reservationService.getByClient(email)
                            .stream()
                            .map(r -> ReservationResponseDTO
                                    .builder()
                                    .id(r.getId())
                                    .terrainId(r.getTerrainId())
                                    .terrainNom(r.getTerrainNom())
                                    .clientNom(r.getClientNom())
                                    .clientEmail(r.getClientEmail())
                                    .clientTel(r.getClientTel())
                                    .dateReservation(
                                            r.getDateReservation() != null
                                                    ? r.getDateReservation()
                                                    .toString() : "")
                                    .heureDebut(
                                            r.getHeureDebut() != null
                                                    ? r.getHeureDebut()
                                                    .toString() : "")
                                    .heureFin(
                                            r.getHeureFin() != null
                                                    ? r.getHeureFin()
                                                    .toString() : "")
                                    .montantTotal(r.getMontantTotal())
                                    .statut(r.getStatut())
                                    .notes(r.getNotes())
                                    .build())
                            .toList();

            return ResponseEntity.ok(reservations);

        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

        // ✅ Vérifier si le client a une réservation active
        @GetMapping("/has-active")
        public ResponseEntity<?> hasActiveReservation(
                        @RequestHeader("Authorization") String authHeader) {
                try {
                        String token = authHeader.replace("Bearer ", "");
                        String email = jwtUtil.extractEmail(token);
                        boolean eligible = reservationService.hasActiveReservation(email);
                        return ResponseEntity.ok(Map.of("eligible", eligible));
                } catch (Exception e) {
                        return ResponseEntity.status(401)
                                        .body(Map.of("erreur", "Token invalide"));
                }
        }
}