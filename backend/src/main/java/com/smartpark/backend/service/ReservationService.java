package com.smartpark.backend.service;

import com.smartpark.backend.dto.ReservationRequestDTO;
import com.smartpark.backend.dto.ReservationResponseDTO;
import com.smartpark.backend.model.Reservation;
import com.smartpark.backend.model.Terrain;
import com.smartpark.backend.repository.ReservationRepository;
import com.smartpark.backend.repository.TerrainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDate;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private TerrainRepository terrainRepository;

    @Autowired
    private TarifDynamiqueService tarifDynamiqueService;

    // ✅ Convertir Reservation → ReservationResponseDTO
    private ReservationResponseDTO toDTO(Reservation r) {
        return ReservationResponseDTO.builder()
                .id(r.getId())
                .terrainId(r.getTerrainId())
                .terrainNom(r.getTerrainNom())
                .clientNom(r.getClientNom())
                .clientEmail(r.getClientEmail())
                .clientTel(r.getClientTel())
                .dateReservation(r.getDateReservation() != null
                        ? r.getDateReservation().toString() : "")
                .heureDebut(r.getHeureDebut() != null
                        ? r.getHeureDebut().toString() : "")
                .heureFin(r.getHeureFin() != null
                        ? r.getHeureFin().toString() : "")
                .montantTotal(r.getMontantTotal())
                .statut(r.getStatut())
                .notes(r.getNotes())
                .build();
    }

    // ✅ Convertir ReservationRequestDTO → Reservation
    private Reservation fromDTO(ReservationRequestDTO dto) {
        Reservation r = new Reservation();
        r.setTerrainId(dto.getTerrainId());
        r.setClientNom(dto.getClientNom());
        r.setClientEmail(dto.getClientEmail());
        r.setClientTel(dto.getClientTel());
        r.setDateReservation(LocalDate.parse(dto.getDateReservation()));
        r.setHeureDebut(LocalTime.parse(dto.getHeureDebut()));
        r.setHeureFin(LocalTime.parse(dto.getHeureFin()));
        r.setNotes(dto.getNotes());
        return r;
    }

    public List<ReservationResponseDTO> getAllReservations() {
        return reservationRepository.findAll()
                .stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<ReservationResponseDTO> getById(String id) {
        return reservationRepository.findById(id).map(this::toDTO);
    }

    public ReservationResponseDTO createReservation(
            ReservationRequestDTO dto) {

        Terrain terrain = terrainRepository
                .findById(dto.getTerrainId())
                .orElseThrow(() ->
                        new RuntimeException("Terrain introuvable"));

        Reservation reservation = fromDTO(dto);

        // Vérifier conflits
        boolean conflit = reservationRepository
                .findByTerrainIdAndDateReservation(
                        reservation.getTerrainId(),
                        reservation.getDateReservation())
                .stream()
                .filter(r -> !"ANNULEE".equals(r.getStatut()))
                .anyMatch(r ->
                        reservation.getHeureDebut()
                                .isBefore(r.getHeureFin()) &&
                                reservation.getHeureFin()
                                        .isAfter(r.getHeureDebut())
                );

        if (conflit) {
            throw new RuntimeException("Créneau déjà réservé !");
        }

        long minutes = ChronoUnit.MINUTES.between(
                reservation.getHeureDebut(),
                reservation.getHeureFin());

        if (minutes <= 0) {
            throw new RuntimeException(
                    "L'heure de fin doit être après l'heure de début !");
        }

        // ✅ Tarif dynamique
        try {
            Map<String, Object> tarif =
                    tarifDynamiqueService.calculerTarif(
                            dto.getTerrainId(),
                            dto.getDateReservation(),
                            dto.getHeureDebut()
                    );
            double tarifFinal = (Double) tarif.get("tarifFinal");
            double montant = Math.round(
                    (minutes / 60.0) * tarifFinal * 100.0) / 100.0;
            reservation.setMontantTotal(montant);
        } catch (Exception e) {
            double montant = Math.round(
                    (minutes / 60.0) * terrain.getTarifHeure()
                            * 100.0) / 100.0;
            reservation.setMontantTotal(montant);
        }

        reservation.setTerrainNom(terrain.getNom());
        reservation.setStatut("CONFIRMEE");

        return toDTO(reservationRepository.save(reservation));
    }

    public ReservationResponseDTO annuler(String id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Réservation introuvable"));
        r.setStatut("ANNULEE");
        return toDTO(reservationRepository.save(r));
    }

    public ReservationResponseDTO confirmer(String id) {
        Reservation r = reservationRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Réservation introuvable"));
        r.setStatut("CONFIRMEE");
        return toDTO(reservationRepository.save(r));
    }

    public void deleteReservation(String id) {
        reservationRepository.deleteById(id);
    }

    public List<ReservationResponseDTO> getByTerrain(String id) {
        return reservationRepository.findByTerrainId(id)
                .stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReservationResponseDTO> getByClient(String email) {
        return reservationRepository.findByClientEmail(email)
                .stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

        public boolean hasActiveReservation(String email) {
                if (email == null || email.isBlank()) {
                        return false;
                }
                return reservationRepository
                        .findFirstByClientEmailAndStatutAndDateReservationGreaterThanEqualAndReservationDiscountUsedFalseOrderByDateReservationAsc(
                                email.trim(),
                                "CONFIRMEE",
                                LocalDate.now()) != null;
        }

    public double getTauxOccupation(String terrainId) {
        List<Reservation> all =
                reservationRepository.findByTerrainId(terrainId);
        if (all.isEmpty()) return 0;
        long confirmees = all.stream()
                .filter(r -> "CONFIRMEE".equals(r.getStatut())).count();
        return Math.round((double) confirmees / all.size() * 100);
    }

    public double getRevenus(String terrainId) {
        return reservationRepository.findByTerrainId(terrainId)
                .stream()
                .filter(r -> "CONFIRMEE".equals(r.getStatut()))
                .mapToDouble(Reservation::getMontantTotal)
                .sum();
    }
}