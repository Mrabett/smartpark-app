package com.smartpark.backend.repository;

import com.smartpark.backend.model.Reservation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends MongoRepository<Reservation, String> {
    List<Reservation> findByTerrainId(String terrainId);
    List<Reservation> findByTerrainIdAndDateReservation(String terrainId, LocalDate date);
    List<Reservation> findByClientEmail(String clientEmail);
    List<Reservation> findByStatut(String statut);
    boolean existsByClientEmailAndStatutAndDateReservationGreaterThanEqual(
            String clientEmail,
            String statut,
            LocalDate dateReservation);
        Reservation findFirstByClientEmailAndStatutAndDateReservationGreaterThanEqualAndReservationDiscountUsedFalseOrderByDateReservationAsc(
            String clientEmail,
            String statut,
            LocalDate dateReservation);
}