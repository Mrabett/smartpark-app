package com.smartpark.backend.parking.repository;

import com.smartpark.backend.parking.entity.Spot;
import com.smartpark.backend.parking.entity.StatutSpot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpotRepository extends MongoRepository<Spot, String> {
    List<Spot> findByParkingId(String parkingId);
    List<Spot> findByStatut(StatutSpot statut);
    List<Spot> findByParkingIdAndStatutAndIsDeletedFalse(String parkingId, StatutSpot statut);
    List<Spot> findByIsDeletedFalse();
    List<Spot> findByParking_Id(String parkingId);
}
