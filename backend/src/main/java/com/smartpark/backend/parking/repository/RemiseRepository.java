package com.smartpark.backend.parking.repository;

import com.smartpark.backend.parking.entity.Remise;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RemiseRepository extends MongoRepository<Remise, String> {
    List<Remise> findByParkingIdAndIsDeletedFalse(String parkingId);
    Remise findTopByParkingIdAndIsDeletedFalseAndSeuilHeuresLessThanEqualOrderBySeuilHeuresDesc(String parkingId, double dureeHeures);
}
