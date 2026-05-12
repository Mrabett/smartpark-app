package com.smartpark.backend.parking.repository;

import com.smartpark.backend.parking.entity.ParkingLot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingLotRepository extends MongoRepository<ParkingLot, String> {
    List<ParkingLot> findByIsDeletedFalse();
    Optional<ParkingLot> findByIdAndIsDeletedFalse(String id);
    List<ParkingLot> findByNomContainingIgnoreCase(String nom);
}
