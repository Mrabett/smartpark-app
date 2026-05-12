package com.smartpark.backend.service;

import com.smartpark.backend.dto.TerrainRequestDTO;
import com.smartpark.backend.dto.TerrainResponseDTO;
import com.smartpark.backend.model.Terrain;
import com.smartpark.backend.repository.ReservationRepository;
import com.smartpark.backend.repository.TerrainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TerrainService {

    @Autowired
    private TerrainRepository terrainRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    // ✅ Convertir Terrain → TerrainResponseDTO
    private TerrainResponseDTO toDTO(Terrain t) {
        long nbRes = reservationRepository
                .findByTerrainId(t.getId()).stream()
                .filter(r -> !"ANNULEE".equals(r.getStatut()))
                .count();

        long nbConf = reservationRepository
                .findByTerrainId(t.getId()).stream()
                .filter(r -> "CONFIRMEE".equals(r.getStatut()))
                .count();

        double taux = nbRes > 0
                ? Math.round((double) nbConf / nbRes * 100) : 0;

        return TerrainResponseDTO.builder()
                .id(t.getId())
                .nom(t.getNom())
                .type(t.getType())
                .capacite(t.getCapacite())
                .tarifHeure(t.getTarifHeure())
                .statut(t.getStatut())
                .description(t.getDescription())
                .equipements(t.getEquipements())
                .nbReservations((int) nbRes)
                .tauxOccupation(taux)
                .build();
    }

    // ✅ Convertir TerrainRequestDTO → Terrain
    private Terrain fromDTO(TerrainRequestDTO dto) {
        Terrain t = new Terrain();
        t.setNom(dto.getNom());
        t.setType(dto.getType());
        t.setCapacite(dto.getCapacite());
        t.setTarifHeure(dto.getTarifHeure());
        t.setStatut(dto.getStatut() != null
                ? dto.getStatut() : "DISPONIBLE");
        t.setDescription(dto.getDescription());
        t.setEquipements(dto.getEquipements());
        return t;
    }

    public List<TerrainResponseDTO> getAllTerrains() {
        return terrainRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<TerrainResponseDTO> getTerrainById(String id) {
        return terrainRepository.findById(id)
                .map(this::toDTO);
    }

    public TerrainResponseDTO createTerrain(TerrainRequestDTO dto) {
        Terrain terrain = fromDTO(dto);
        terrain.setStatut("DISPONIBLE");
        return toDTO(terrainRepository.save(terrain));
    }

    public TerrainResponseDTO updateTerrain(
            String id, TerrainRequestDTO dto) {
        Terrain terrain = terrainRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Terrain introuvable : " + id));

        terrain.setNom(dto.getNom());
        terrain.setType(dto.getType());
        terrain.setCapacite(dto.getCapacite());
        terrain.setTarifHeure(dto.getTarifHeure());
        terrain.setStatut(dto.getStatut());
        terrain.setDescription(dto.getDescription());
        terrain.setEquipements(dto.getEquipements());

        return toDTO(terrainRepository.save(terrain));
    }

    public void deleteTerrain(String id) {
        terrainRepository.deleteById(id);
    }

    public List<TerrainResponseDTO> getByType(String type) {
        return terrainRepository.findByType(type)
                .stream().map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<TerrainResponseDTO> getDisponibles() {
        return terrainRepository.findByStatut("DISPONIBLE")
                .stream().map(this::toDTO)
                .collect(Collectors.toList());
    }
}