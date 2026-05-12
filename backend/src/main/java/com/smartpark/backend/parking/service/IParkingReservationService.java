package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.ParkingReservationDTO;
import java.time.LocalDateTime;
import java.util.List;

public interface IParkingReservationService {
    ParkingReservationDTO createReservation(ParkingReservationDTO reservationDTO);
    boolean isSpotAvailable(String spotId, LocalDateTime start, LocalDateTime end);
    double calculatePrice(LocalDateTime start, LocalDateTime end);
    List<ParkingReservationDTO> getAll();
    ParkingReservationDTO getById(String id);
    void cancelReservation(String id);
    List<ParkingReservationDTO> findBySpot(String spotId);
    List<ParkingReservationDTO> findByVehicle(String matricule);
    List<ParkingReservationDTO> findByParking(String parkingId);
    ParkingReservationDTO updateReservation(String id, ParkingReservationDTO updatedReservation);
    ParkingReservationDTO enregistrerPassageAuto(ParkingReservationDTO iaDto);
    ParkingReservationDTO enregistrerSortieAuto(ParkingReservationDTO iaDto);
    java.util.Map<String, String> getLatestExitImage();
    java.util.Map<String, String> getLatestEntryImage();
    List<ParkingReservationDTO> findByUser(String userId);
    List<ParkingReservationDTO> findEnCours();
}
