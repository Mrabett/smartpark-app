package com.smartpark.backend.parking.controller;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.smartpark.backend.parking.dto.ParkingReservationDTO;
import com.smartpark.backend.parking.service.IParkingReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parking-reservations")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class ParkingReservationController {

    @Autowired
    private IParkingReservationService reservationService;

    @GetMapping
    public ResponseEntity<List<ParkingReservationDTO>> getAll() {
        return ResponseEntity.ok(reservationService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingReservationDTO> getById(@PathVariable String id) {
        ParkingReservationDTO res = reservationService.getById(id);
        return (res != null) ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody ParkingReservationDTO reservationDTO) {
        try {
            return new ResponseEntity<>(reservationService.createReservation(reservationDTO), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable String id) {
        reservationService.cancelReservation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/spot/{spotId}")
    public ResponseEntity<List<ParkingReservationDTO>> getBySpot(@PathVariable String spotId) {
        return ResponseEntity.ok(reservationService.findBySpot(spotId));
    }

    @GetMapping("/vehicle/{matricule}")
    public ResponseEntity<List<ParkingReservationDTO>> getByVehicle(@PathVariable String matricule) {
        return ResponseEntity.ok(reservationService.findByVehicle(matricule));
    }

    @GetMapping("/parking/{parkingId}")
    public ResponseEntity<List<ParkingReservationDTO>> getByParking(@PathVariable String parkingId) {
        return ResponseEntity.ok(reservationService.findByParking(parkingId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ParkingReservationDTO>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(reservationService.findByUser(userId));
    }

    // ✅ Nouvel endpoint : récupérer toutes les détections IA en attente de décision employé
    @GetMapping("/en-cours")
    public ResponseEntity<List<ParkingReservationDTO>> getEnCours() {
        return ResponseEntity.ok(reservationService.findEnCours());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(@PathVariable String id,
                                               @Valid @RequestBody ParkingReservationDTO updatedReservation) {
        try {
            return ResponseEntity.ok(reservationService.updateReservation(id, updatedReservation));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/valider-flux")
    public ResponseEntity<ParkingReservationDTO> validerFlux(@PathVariable String id,
                                                             @RequestBody Map<String, Object> updates) {
        ParkingReservationDTO res = reservationService.getById(id);
        if (res == null) return ResponseEntity.notFound().build();

        if (updates.containsKey("statusAction")) {
            res.setStatusAction((String) updates.get("statusAction"));
        }
        if (updates.containsKey("montantFinal")) {
            res.setMontantFinal(Double.valueOf(updates.get("montantFinal").toString()));
        }
        if (updates.containsKey("parkingId")) {
            res.setParkingId((String) updates.get("parkingId"));
        }
        if (updates.containsKey("spotId")) {
            res.setSpotId((String) updates.get("spotId"));
        }
        // ✅ Transmission des images lors de la validation
        if (updates.containsKey("imageEntree")) {
            res.setImageEntree((String) updates.get("imageEntree"));
        }
        if (updates.containsKey("imageSortie")) {
            res.setImageSortie((String) updates.get("imageSortie"));
        }

        try {
            return ResponseEntity.ok(reservationService.updateReservation(id, res));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/pdf/{id}")
    public ResponseEntity<byte[]> generateTicketPdf(@PathVariable String id) {
        ParkingReservationDTO res = reservationService.getById(id);
        if (res == null) return ResponseEntity.notFound().build();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A6);
            PdfWriter.getInstance(document, out);
            document.open();

            Font boldFont = new Font(Font.HELVETICA, 14, Font.BOLD);
            Font normalFont = new Font(Font.HELVETICA, 10, Font.NORMAL);

            document.add(new Paragraph("RECU PARKING", boldFont));
            document.add(new Paragraph("------------------------------", normalFont));
            document.add(new Paragraph("ID: " + res.getId(), normalFont));
            document.add(new Paragraph("CLIENT: " + (res.getUserName() != null ? res.getUserName() : "N/A"), normalFont));
            document.add(new Paragraph("MATRICULE: " + res.getMatricule(), normalFont));
            document.add(new Paragraph("ENTREE: " + res.getDatetimeEntree(), normalFont));
            document.add(new Paragraph("SORTIE: " + res.getDatetimeSortie(), normalFont));
            document.add(new Paragraph("------------------------------", normalFont));
            document.add(new Paragraph("PRIX: " + res.getMontant() + " TND", boldFont));
            document.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", "ticket.pdf");
            return new ResponseEntity<>(out.toByteArray(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ✅ Entrée IA — caméra d'entrée détecte la plaque
    @PostMapping("/entree-ia")
    public ResponseEntity<ParkingReservationDTO> entreeIA(@RequestBody ParkingReservationDTO dto) {
        return ResponseEntity.ok(reservationService.enregistrerPassageAuto(dto));
    }

    // ✅ Sortie IA — caméra de sortie détecte la plaque
    @PostMapping("/sortie-ia")
    public ResponseEntity<?> sortieIA(@RequestBody ParkingReservationDTO dto) {
        try {
            return ResponseEntity.ok(reservationService.enregistrerSortieAuto(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // ✅ Récupération du tampon de la caméra IA pour la vue Admin
    @GetMapping("/latest-exit-image")
    public ResponseEntity<Map<String, String>> getLatestExitImage() {
        return ResponseEntity.ok(reservationService.getLatestExitImage());
    }

    // ✅ Récupération du tampon de la caméra d'entrée
    @GetMapping("/latest-entry-image")
    public ResponseEntity<Map<String, String>> getLatestEntryImage() {
        return ResponseEntity.ok(reservationService.getLatestEntryImage());
    }
}