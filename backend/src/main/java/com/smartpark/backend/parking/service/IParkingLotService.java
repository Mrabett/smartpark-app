package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.ParkingLotDTO;
import java.util.List;

public interface IParkingLotService {
    ParkingLotDTO addParking(ParkingLotDTO parkingDTO);
    ParkingLotDTO updateParking(String id, ParkingLotDTO parkingDTO);
    List<ParkingLotDTO> findAll();
    ParkingLotDTO findById(String id);
    void delete(String id);
    List<ParkingLotDTO> findActivePromotions();
}
