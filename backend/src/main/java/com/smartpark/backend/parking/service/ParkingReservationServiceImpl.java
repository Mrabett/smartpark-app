package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.ParkingReservationDTO;
import com.smartpark.backend.parking.entity.ParkingReservation;
import com.smartpark.backend.parking.entity.Spot;
import com.smartpark.backend.parking.repository.ParkingReservationRepository;
import com.smartpark.backend.parking.repository.SpotRepository;
import com.smartpark.backend.parking.repository.ParkingLotRepository;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ParkingReservationServiceImpl implements IParkingReservationService {

    // 🔥 TAMPON MÉMOIRE POUR LA CAMÉRA DE SORTIE IA 🔥
    private String dernierImageSortie = null;
    private LocalDateTime heureDerniereImage = null;

    // 🔥 TAMPON MÉMOIRE POUR LA CAMÉRA D'ENTRÉE IA 🔥
    private String dernierImageEntree = null;
    private LocalDateTime heureDerniereImageEntree = null;

    @Autowired
    private ParkingReservationRepository reservationRepository;
    @Autowired
    private SpotRepository spotRepository;
    @Autowired
    private ParkingLotRepository parkingRepository;
    @Autowired
    private IRecetteService recetteService;

    private ParkingReservationDTO mapToDTO(ParkingReservation res) {
        if (res == null)
            return null;
        ParkingReservationDTO dto = ParkingReservationDTO.builder()
                .id(res.getId()).matricule(res.getMatricule())
                .datetimeEntree(res.getDatetimeEntree()).datetimeSortie(res.getDatetimeSortie())
                .montant(res.getMontant()).montantFinal(res.getMontantFinal())
                .statusAction(res.getStatusAction()).qrCode(res.getQrCode())
                .voitureMarque(res.getVoitureMarque()).voitureCouleur(res.getVoitureCouleur())
                .voitureModele(res.getVoitureModele()).spontane(res.isSpontane())
                .scoreConfiance(res.getScoreConfiance() != null ? res.getScoreConfiance() : 0.0)
                .imageEntree(res.getImageEntree())
                .imageSortie(res.getImageSortie())
                .heureDetectionIa(res.getHeureDetectionIa())
                .userId(res.getUserId()).userName(res.getUserName())
                .build();

        if (res.getSpot() != null) {
            dto.setSpotId(res.getSpot().getId());
            dto.setSpotNom(res.getSpot().getNom());
            if (res.getSpot().getParking() != null) {
                String pId = res.getSpot().getParking().getId();
                dto.setParkingId(pId);
                dto.setParkingNom(res.getSpot().getParking().getNom());
                parkingRepository.findById(pId).ifPresent(p -> {
                    dto.setTarifDepassement(p.getTarifDepassement() != null ? p.getTarifDepassement() : 0.0);
                    dto.setRemiseRetard(p.getRemiseRetard() != null ? p.getRemiseRetard() : 0.0);
                });
            }
        } else {
            dto.setSpotNom("Sans place");
        }
        return dto;
    }

    private ParkingReservation mapToEntity(ParkingReservationDTO dto) {
        ParkingReservation res = new ParkingReservation();
        res.setId(dto.getId());
        res.setMatricule(dto.getMatricule());
        res.setDatetimeEntree(dto.getDatetimeEntree());
        res.setDatetimeSortie(dto.getDatetimeSortie());
        res.setMontant(dto.getMontant());
        res.setMontantFinal(dto.getMontantFinal());
        res.setStatusAction(dto.getStatusAction());
        res.setImageEntree(dto.getImageEntree());
        res.setImageSortie(dto.getImageSortie());
        res.setHeureDetectionIa(dto.getHeureDetectionIa());
        res.setUserId(dto.getUserId());
        res.setUserName(dto.getUserName());
        return res;
    }

    @Override
    public ParkingReservationDTO createReservation(ParkingReservationDTO dto) {
        if (dto.getSpotId() == null)
            throw new RuntimeException("Spot ID is required");
        Spot spot = spotRepository.findById(dto.getSpotId())
                .orElseThrow(() -> new RuntimeException("Spot introuvable"));

        if (!isSpotAvailable(dto.getSpotId(), dto.getDatetimeEntree(), dto.getDatetimeSortie())) {
            throw new RuntimeException("Conflict: Ce spot est déjà réservé.");
        }

        ParkingReservation res = mapToEntity(dto);
        res.setSpot(spot);
        res.setCreatedAt(LocalDateTime.now());
        res.setUpdatedAt(LocalDateTime.now());
        res.setDate(LocalDateTime.now());
        res.setIsDeleted(false);
        res.setQrCode(UUID.randomUUID().toString());

        if (res.getMontant() <= 0) {
            res.setMontant(calculatePrice(res.getDatetimeEntree(), res.getDatetimeSortie()));
        }
        return mapToDTO(reservationRepository.save(res));
    }

    @Override
    public ParkingReservationDTO getById(String id) {
        return reservationRepository.findById(id)
                .filter(r -> !r.getIsDeleted())
                .map(this::mapToDTO).orElse(null);
    }

    @Override
    public ParkingReservationDTO updateReservation(String id, ParkingReservationDTO updatedDto) {
        ParkingReservation existing = reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
        String oldStatus = existing.getStatusAction();

        existing.setMatricule(updatedDto.getMatricule());
        existing.setDatetimeEntree(updatedDto.getDatetimeEntree());
        existing.setDatetimeSortie(updatedDto.getDatetimeSortie());
        if (updatedDto.getStatusAction() != null)
            existing.setStatusAction(updatedDto.getStatusAction());
        if (updatedDto.getMontantFinal() != null)
            existing.setMontantFinal(updatedDto.getMontantFinal());

        if (updatedDto.getImageEntree() != null)
            existing.setImageEntree(updatedDto.getImageEntree());
        if (updatedDto.getImageSortie() != null)
            existing.setImageSortie(updatedDto.getImageSortie());

        if (updatedDto.getSpotId() != null) {
            spotRepository.findById(updatedDto.getSpotId()).ifPresent(existing::setSpot);
        }

        if (updatedDto.getParkingId() != null && existing.getParking() == null) {
            parkingRepository.findById(updatedDto.getParkingId()).ifPresent(existing::setParking);
        }

        existing.setUpdatedAt(LocalDateTime.now());

        ParkingReservation saved = reservationRepository.save(existing);

        if (!"SORTIE_VALIDEE".equals(oldStatus) && "SORTIE_VALIDEE".equals(updatedDto.getStatusAction())) {
            double total = (saved.getMontantFinal() != null) ? saved.getMontantFinal() : saved.getMontant();
            recetteService.enregistrerSortie(total);
        }
        return mapToDTO(saved);
    }

    @Override
    public List<ParkingReservationDTO> getAll() {
        return reservationRepository.findByIsDeletedFalse().stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public double calculatePrice(LocalDateTime start, LocalDateTime end) {
        long hours = Duration.between(start, end).toHours();
        if (hours <= 0)
            hours = 1;
        return hours * 5.0;
    }

    @Override
    public boolean isSpotAvailable(String spotId, LocalDateTime start, LocalDateTime end) {
        List<ParkingReservation> existing = reservationRepository.findBySpotId(spotId);
        return existing.stream().filter(r -> !r.getIsDeleted() &&
                !"SORTIE_VALIDEE".equals(r.getStatusAction()) &&
                !"ANNULEE".equals(r.getStatusAction()))
                .noneMatch(r -> {
                    LocalDateTime rEntry = r.getDatetimeEntree();
                    LocalDateTime rExit = r.getDatetimeSortie();
                    if (rEntry == null)
                        return false;

                    if (rExit == null) {
                        // Client spontané encore garé
                        return end.isAfter(rEntry);
                    }
                    return start.isBefore(rExit) && end.isAfter(rEntry);
                });
    }

    @Override
    public void cancelReservation(String id) {
        reservationRepository.findById(id).ifPresent(res -> {
            res.setIsDeleted(true);
            res.setUpdatedAt(LocalDateTime.now());
            reservationRepository.save(res);
        });
    }

    @Override
    public List<ParkingReservationDTO> findBySpot(String spotId) {
        return reservationRepository.findBySpotIdAndIsDeletedFalse(spotId).stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public List<ParkingReservationDTO> findByVehicle(String matricule) {
        return reservationRepository.findByMatriculeIgnoreCase(matricule).stream()
                .filter(r -> !r.getIsDeleted())
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public List<ParkingReservationDTO> findByParking(String parkingId) {
        List<Spot> spots = spotRepository.findByParking_Id(parkingId);
        if (spots.isEmpty())
            return List.of();
        List<ObjectId> spotObjectIds = spots.stream()
                .map(s -> new ObjectId(s.getId()))
                .collect(Collectors.toList());
        return reservationRepository.findBySpotIdsIn(spotObjectIds).stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public ParkingReservationDTO enregistrerPassageAuto(ParkingReservationDTO iaDto) {
        // Alimentation du tampon d'entrée Zéro-OCR
        if (iaDto.getImageEntree() != null) {
            this.dernierImageEntree = iaDto.getImageEntree();
            this.heureDerniereImageEntree = LocalDateTime.now();
        }

        // Bloquer si le véhicule est déjà à l'intérieur
        boolean alreadyInside = reservationRepository.findByMatriculeIgnoreCase(iaDto.getMatricule())
                .stream()
                .anyMatch(r -> !r.getIsDeleted()
                        && ("ENTREE_VALIDEE".equals(r.getStatusAction()) || "EN_COURS".equals(r.getStatusAction())));

        if (alreadyInside) {
            throw new RuntimeException("Ce véhicule est déjà à l'intérieur du parking !");
        }

        List<ParkingReservation> futures = reservationRepository.findByMatriculeIgnoreCase(iaDto.getMatricule())
                .stream()
                .filter(r -> !r.getIsDeleted() && "EN_ATTENTE".equals(r.getStatusAction()))
                .collect(Collectors.toList());

        ParkingReservation session;
        if (!futures.isEmpty()) {
            session = futures.get(0);
            session.setStatusAction("EN_COURS"); // En attente de validation QR
            session.setVoitureMarque(iaDto.getVoitureMarque());
            session.setVoitureCouleur(iaDto.getVoitureCouleur());
            session.setSpontane(false);
            session.setImageEntree(iaDto.getImageEntree());
            session.setHeureDetectionIa(LocalDateTime.now()); // Lancement du chrono
        } else {
            session = new ParkingReservation();
            session.setMatricule(iaDto.getMatricule());
            session.setDatetimeEntree(LocalDateTime.now());
            session.setVoitureMarque(iaDto.getVoitureMarque());
            session.setVoitureCouleur(iaDto.getVoitureCouleur());
            session.setSpontane(true);
            session.setStatusAction("EN_COURS"); // En attente de validation QR
            session.setMontant(0.0);
            session.setImageEntree(iaDto.getImageEntree());
            session.setHeureDetectionIa(LocalDateTime.now()); // Lancement du chrono
        }
        return mapToDTO(reservationRepository.save(session));
    }

    @Override
    public ParkingReservationDTO enregistrerSortieAuto(ParkingReservationDTO iaDto) {
        // 🔥 L'IA ne cherche plus en base de données. Elle pose juste l'image dans le
        // tampon.
        this.dernierImageSortie = iaDto.getImageSortie();
        this.heureDerniereImage = LocalDateTime.now();

        System.out.println("📸 CAMÉRA SORTIE : Nouvelle photo stockée temporairement dans le tampon !");

        // On retourne le DTO vide (le frontend Admin va piocher l'image lui-même)
        return iaDto;
    }

    @Override
    public Map<String, String> getLatestExitImage() {
        if (heureDerniereImage != null && dernierImageSortie != null) {
            // L'image expire après 2 minutes de rétention (au cas où personne n'ouvre de
            // ticket)
            if (heureDerniereImage.isAfter(LocalDateTime.now().minusMinutes(2))) {
                String img = dernierImageSortie;
                this.dernierImageSortie = null; // On "consomme" l'image, elle n'est plus disponible
                return Map.of("image", img);
            } else {
                this.dernierImageSortie = null; // Expirée
            }
        }
        return Map.of(); // Vide
    }

    // Cette méthode s'exécute automatiquement toutes les 10 secondes
    @Scheduled(fixedRate = 10000)
    public void nettoyerReservationsNonValidees() {
        LocalDateTime ilYAMinute = LocalDateTime.now().minusMinutes(1);
        List<ParkingReservation> enCours = reservationRepository.findByStatusAction("EN_COURS");

        for (ParkingReservation res : enCours) {
            // Si l'IA a pris la photo il y a plus d'1 minute et que l'employé n'a rien
            // validé
            if (res.getHeureDetectionIa() != null && res.getHeureDetectionIa().isBefore(ilYAMinute)) {
                if (res.isSpontane()) {
                    // C'était une fausse détection ou la voiture est partie : on supprime
                    res.setIsDeleted(true);
                } else {
                    // C'était un client avec réservation web : on annule l'entrée IA, il reste
                    // attendu
                    res.setStatusAction("EN_ATTENTE");
                    res.setImageEntree(null);
                    res.setHeureDetectionIa(null);
                }
                reservationRepository.save(res);
                System.out.println("⏳ Timeout : Réservation " + res.getMatricule() + " nettoyée après 1 minute.");
            }
        }
    }

    public List<ParkingReservationDTO> findByUser(String userId) {
        return reservationRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(this::mapToDTO).collect(Collectors.toList());
    }

    @Override
    public java.util.Map<String, String> getLatestEntryImage() {
        if (heureDerniereImageEntree != null && dernierImageEntree != null) {
            if (heureDerniereImageEntree.isAfter(LocalDateTime.now().minusMinutes(2))) {
                String img = dernierImageEntree;
                return java.util.Map.of("image", img, "timestamp", heureDerniereImageEntree.toString());
            } else {
                this.dernierImageEntree = null; // Expirée
            }
        }
        return java.util.Map.of(); // Vide
    }

    @Override
    public List<ParkingReservationDTO> findEnCours() {
        // On récupère toutes les réservations ayant le statut "EN_COURS"
        return reservationRepository.findByStatusAction("EN_COURS").stream()
                .filter(r -> !r.getIsDeleted()) // Sécurité : on ignore celles qui sont supprimées
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

}
