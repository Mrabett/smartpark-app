package com.smartpark.backend.parking.repository;

import com.smartpark.backend.parking.entity.ParkingReservation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ParkingReservationRepository extends MongoRepository<ParkingReservation, String> {
    List<ParkingReservation> findBySpotId(String spotId);
    List<ParkingReservation> findByMatriculeIgnoreCase(String matricule);
    List<ParkingReservation> findByIsDeletedFalse();
    List<ParkingReservation> findBySpotIdAndIsDeletedFalse(String spotId);
    List<ParkingReservation> findBySpot_Parking_IdAndIsDeletedFalse(String parkingId);
    List<ParkingReservation> findBySpotIdInAndIsDeletedFalse(List<String> spotIds);

    @Query("{ 'spot': { $in: ?0 }, 'isDeleted': false }")
    List<ParkingReservation> findBySpotIdsIn(List<org.bson.types.ObjectId> spotIds);

    List<ParkingReservation> findByUserIdAndIsDeletedFalse(String userId);
    List<ParkingReservation> findByStatusAction(String statusAction);
    ParkingReservation findByQrCodeAndIsDeletedFalse(String qrCode);
}
