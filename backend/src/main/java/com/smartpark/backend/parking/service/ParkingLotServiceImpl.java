package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.ParkingLotDTO;
import com.smartpark.backend.parking.dto.RemiseDTO;
import com.smartpark.backend.parking.dto.SpotDTO;
import com.smartpark.backend.parking.entity.ParkingLot;
import com.smartpark.backend.parking.entity.Spot;
import com.smartpark.backend.parking.entity.StatutSpot;
import com.smartpark.backend.parking.entity.TypeParking;
import com.smartpark.backend.parking.repository.ParkingLotRepository;
import com.smartpark.backend.parking.repository.SpotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParkingLotServiceImpl implements IParkingLotService {

    @Autowired private ParkingLotRepository parkingRepository;
    @Autowired private SpotRepository spotRepository;

    private ParkingLotDTO mapToDTO(ParkingLot parking) {
        if (parking == null) return null;
        List<SpotDTO> spotDTOs = (parking.getSpots() == null) ? List.of() :
                parking.getSpots().stream().map(s -> SpotDTO.builder()
                        .id(s.getId()).nom(s.getNom()).description(s.getDescription())
                        .statut(s.getStatut()).x(s.getX()).y(s.getY())
                        .parkingId(parking.getId()).build()
                ).collect(Collectors.toList());

        List<RemiseDTO> remiseDTOs = (parking.getRemises() == null) ? List.of() :
                parking.getRemises().stream().map(r -> RemiseDTO.builder()
                        .id(r.getId()).seuilHeures((int) r.getSeuilHeures())
                        .pourcentageRemise(r.getPourcentageRemise())
                        .description(r.getDescription()).themeVisuel(r.getThemeVisuel())
                        .parkingId(parking.getId()).build()
                ).collect(Collectors.toList());

        return ParkingLotDTO.builder()
                .id(parking.getId()).nom(parking.getNom())
                .description(parking.getDescription())
                .typeParking(parking.getTypeParking() != null ? parking.getTypeParking().name() : null)
                .prixInitial(parking.getPrixInitial()).prixPromos(parking.getPrixPromos())
                .tarifDepassement(parking.getTarifDepassement() != null ? parking.getTarifDepassement() : 0)
                .remiseRetard(parking.getRemiseRetard() != null ? parking.getRemiseRetard() : 0)
                .isEvent(parking.isEvent())
                .dateDebutPromos(parking.getDateDebutPromos()).dateFinPromos(parking.getDateFinPromos())
                .spots(spotDTOs).remises(remiseDTOs).build();
    }

    private ParkingLot mapToEntity(ParkingLotDTO dto) {
        ParkingLot parking = new ParkingLot();
        parking.setId(dto.getId());
        parking.setNom(dto.getNom());
        parking.setDescription(dto.getDescription());
        if (dto.getTypeParking() != null) {
            try { parking.setTypeParking(TypeParking.valueOf(dto.getTypeParking())); }
            catch (IllegalArgumentException ignored) {}
        }
        parking.setPrixInitial(dto.getPrixInitial());
        parking.setPrixPromos(dto.getPrixPromos());
        parking.setTarifDepassement(dto.getTarifDepassement());
        parking.setRemiseRetard(dto.getRemiseRetard());
        parking.setEvent(dto.isEvent());
        parking.setDateDebutPromos(dto.getDateDebutPromos());
        parking.setDateFinPromos(dto.getDateFinPromos());
        return parking;
    }

    @Override
    public ParkingLotDTO addParking(ParkingLotDTO parkingDTO) {
        ParkingLot parking = mapToEntity(parkingDTO);
        parking.setCreatedAt(LocalDateTime.now());
        parking.setUpdatedAt(LocalDateTime.now());
        parking.setIsDeleted(false);
        parking.setSpots(new ArrayList<>());
        ParkingLot savedParking = parkingRepository.save(parking);

        if (parkingDTO.getSpots() != null && !parkingDTO.getSpots().isEmpty()) {
            List<Spot> savedSpots = new ArrayList<>();
            for (SpotDTO spotDTO : parkingDTO.getSpots()) {
                Spot spot = new Spot();
                spot.setNom(spotDTO.getNom());
                spot.setDescription(spotDTO.getDescription());
                spot.setStatut(spotDTO.getStatut() != null ? spotDTO.getStatut() : StatutSpot.LIBRE);
                spot.setX(spotDTO.getX());
                spot.setY(spotDTO.getY());
                spot.setCreatedAt(LocalDateTime.now());
                spot.setUpdatedAt(LocalDateTime.now());
                spot.setIsDeleted(false);
                spot.setParking(savedParking);
                savedSpots.add(spotRepository.save(spot));
            }
            savedParking.setSpots(savedSpots);
            savedParking = parkingRepository.save(savedParking);
        }
        return mapToDTO(savedParking);
    }

    @Override
    public ParkingLotDTO updateParking(String id, ParkingLotDTO parkingDTO) {
        return parkingRepository.findById(id).map(existing -> {
            existing.setNom(parkingDTO.getNom());
            existing.setDescription(parkingDTO.getDescription());
            if (parkingDTO.getTypeParking() != null) {
                try { existing.setTypeParking(TypeParking.valueOf(parkingDTO.getTypeParking())); }
                catch (IllegalArgumentException ignored) {}
            }
            existing.setPrixInitial(parkingDTO.getPrixInitial());
            existing.setPrixPromos(parkingDTO.getPrixPromos());
            existing.setTarifDepassement(parkingDTO.getTarifDepassement());
            existing.setRemiseRetard(parkingDTO.getRemiseRetard());
            existing.setEvent(parkingDTO.isEvent());
            existing.setDateDebutPromos(parkingDTO.getDateDebutPromos());
            existing.setDateFinPromos(parkingDTO.getDateFinPromos());
            existing.setUpdatedAt(LocalDateTime.now());
            return mapToDTO(parkingRepository.save(existing));
        }).orElse(null);
    }

    @Override
    public List<ParkingLotDTO> findAll() {
        return parkingRepository.findByIsDeletedFalse().stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public ParkingLotDTO findById(String id) {
        return parkingRepository.findByIdAndIsDeletedFalse(id).map(this::mapToDTO).orElse(null);
    }

    @Override
    public void delete(String id) {
        parkingRepository.findById(id).ifPresent(parking -> {
            parking.setIsDeleted(true);
            parking.setUpdatedAt(LocalDateTime.now());
            parkingRepository.save(parking);
        });
    }

    @Override
    public List<ParkingLotDTO> findActivePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return parkingRepository.findByIsDeletedFalse().stream()
                .filter(p -> p.getPrixPromos() > 0
                        && p.getDateDebutPromos() != null && p.getDateDebutPromos().isBefore(now.toLocalDate())
                        && p.getDateFinPromos() != null && p.getDateFinPromos().isAfter(now.toLocalDate()))
                .map(this::mapToDTO).collect(Collectors.toList());
    }
}
