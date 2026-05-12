package com.smartpark.backend.controller;

import com.smartpark.backend.dto.TerrainRequestDTO;
import com.smartpark.backend.dto.TerrainResponseDTO;
import com.smartpark.backend.service.TerrainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/terrains")
@CrossOrigin(origins = "http://localhost:4200")
public class TerrainController {

    @Autowired
    private TerrainService terrainService;

    @GetMapping
    public List<TerrainResponseDTO> getAll() {
        return terrainService.getAllTerrains();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TerrainResponseDTO> getById(
            @PathVariable String id) {
        return terrainService.getTerrainById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Reçoit un DTO, retourne un DTO
    @PostMapping
    public TerrainResponseDTO create(
            @RequestBody TerrainRequestDTO dto) {
        return terrainService.createTerrain(dto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TerrainResponseDTO> update(
            @PathVariable String id,
            @RequestBody TerrainRequestDTO dto) {
        return ResponseEntity.ok(
                terrainService.updateTerrain(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        terrainService.deleteTerrain(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/disponibles")
    public List<TerrainResponseDTO> getDisponibles() {
        return terrainService.getDisponibles();
    }

    @GetMapping("/type/{type}")
    public List<TerrainResponseDTO> getByType(
            @PathVariable String type) {
        return terrainService.getByType(type);
    }
}