package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.SpotDTO;
import com.smartpark.backend.parking.entity.StatutSpot;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface ISpotService {
    SpotDTO addSpot(SpotDTO spotDTO);
    SpotDTO updateSpot(String id, SpotDTO spotDTO);
    List<SpotDTO> getAllSpots();
    SpotDTO getById(String id);
    void deleteSpot(String id);
    List<SpotDTO> findByParking(String parkingId);
    List<SpotDTO> findAvailableByParking(String parkingId);
    void updateStatus(String id, StatutSpot newStatus);
    List<SpotDTO> addMultipleSpots(List<SpotDTO> spots);
    List<SpotDTO> scanAndGenerateSpots(String parkingId, MultipartFile file) throws IOException;
}
