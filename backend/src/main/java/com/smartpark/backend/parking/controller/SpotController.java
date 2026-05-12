package com.smartpark.backend.parking.controller;

import com.smartpark.backend.parking.dto.SpotDTO;
import com.smartpark.backend.parking.entity.StatutSpot;
import com.smartpark.backend.parking.service.ISpotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/spots")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SpotController {

    @Autowired
    private ISpotService spotService;

    @GetMapping
    public ResponseEntity<List<SpotDTO>> getAll() {
        return ResponseEntity.ok(spotService.getAllSpots());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SpotDTO> getById(@PathVariable String id) {
        SpotDTO spot = spotService.getById(id);
        return (spot != null) ? ResponseEntity.ok(spot) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<SpotDTO> create(@RequestBody SpotDTO spotDTO) {
        return new ResponseEntity<>(spotService.addSpot(spotDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpotDTO> update(@PathVariable String id, @RequestBody SpotDTO spotDTO) {
        SpotDTO updated = spotService.updateSpot(id, spotDTO);
        return (updated != null) ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        spotService.deleteSpot(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/parking/{parkingId}")
    public ResponseEntity<List<SpotDTO>> getByParking(@PathVariable String parkingId) {
        return ResponseEntity.ok(spotService.findByParking(parkingId));
    }

    @GetMapping("/parking/{parkingId}/available")
    public ResponseEntity<List<SpotDTO>> getAvailableByParking(@PathVariable String parkingId) {
        return ResponseEntity.ok(spotService.findAvailableByParking(parkingId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> changeStatus(@PathVariable String id, @RequestParam StatutSpot status) {
        spotService.updateStatus(id, status);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/scan/{parkingId}")
    public ResponseEntity<List<SpotDTO>> scanParking(
            @PathVariable String parkingId,
            @RequestParam("file") MultipartFile file) {
        try {
            List<SpotDTO> detectedSpots = spotService.scanAndGenerateSpots(parkingId, file);
            return ResponseEntity.ok(detectedSpots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }


}
