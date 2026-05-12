package com.smartpark.backend.parking.controller;

import com.smartpark.backend.parking.dto.ParkingLotDTO;
import com.smartpark.backend.parking.service.IParkingLotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.web.multipart.MultipartFile; // 👈 Import nécessaire

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parkings")
@CrossOrigin(origins = "http://localhost:4200", allowedHeaders = "*") // 👈 Origine précise
public class ParkingLotController {

    @Autowired
    private IParkingLotService parkingService;

    // --- MÉTHODES EXISTANTES ---

    @GetMapping
    public ResponseEntity<List<ParkingLotDTO>> getAllParkings() {
        return ResponseEntity.ok(parkingService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingLotDTO> getParkingById(@PathVariable String id) {
        ParkingLotDTO parking = parkingService.findById(id);
        return (parking != null) ? ResponseEntity.ok(parking) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ParkingLotDTO> createParking(@Valid @RequestBody ParkingLotDTO parkingDTO) {
        return new ResponseEntity<>(parkingService.addParking(parkingDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ParkingLotDTO> updateParking(@PathVariable String id, @Valid @RequestBody ParkingLotDTO parkingDTO) {
        ParkingLotDTO updated = parkingService.updateParking(id, parkingDTO);
        return (updated != null) ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParking(@PathVariable String id) {
        parkingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/promotions")
    public ResponseEntity<List<ParkingLotDTO>> getPromotions() {
        return ResponseEntity.ok(parkingService.findActivePromotions());
    }

    // --- 🚀 NOUVELLE MÉTHODE : AUTOMATISATION IA ---

    @PostMapping("/{id}/upload-layout")
    public ResponseEntity<Map<String, String>> uploadLayout(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        System.out.println("📥 Requête d'upload reçue pour le parking ID : " + id);

        try {
            // 1. Chemin vers le dossier de scripts Python
            String userDir = System.getProperty("user.dir");
            System.out.println("📂 user.dir = " + userDir);

            // Chercher le dossier scripts en remontant si nécessaire
            String scriptDir = userDir + File.separator + "scripts";
            File scriptDirFile = new File(scriptDir);

            // Si le dossier scripts n'existe pas directement, chercher dans backend/scripts
            if (!scriptDirFile.exists()) {
                scriptDir = userDir + File.separator + "backend" + File.separator + "scripts";
                scriptDirFile = new File(scriptDir);
            }

            if (!scriptDirFile.exists()) {
                System.err.println("❌ Dossier scripts introuvable ! Testé : " + scriptDir);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Collections.singletonMap("error", "Dossier scripts introuvable"));
            }

            System.out.println("📂 Scripts directory : " + scriptDirFile.getAbsolutePath());

            // 2. Sauvegarde du fichier image
            String fileName = "parking_ia_" + id + ".jpg";
            Path path = Paths.get(scriptDir, fileName);
            Files.write(path, file.getBytes());
            System.out.println("✅ Image sauvegardée : " + path.toAbsolutePath());

            // 3. SEQUENCE AUTOMATIQUE

            // Étape A : detect_spots.py (Ouverture de la fenêtre pour l'admin)
            System.out.println("🖥️ Ouverture de la fenêtre de configuration...");
            ProcessBuilder pb1 = new ProcessBuilder("python", "detect_spots.py", fileName, id);
            pb1.directory(new File(scriptDir));
            pb1.inheritIO();
            Process p1 = pb1.start();

            // On attend que l'admin ferme la fenêtre après ses 4 clics
            int exitCode = p1.waitFor();
            System.out.println("🏁 detect_spots terminé avec code : " + exitCode);

            if (exitCode == 0) {
                // Étape B : generateur_spots.py (IA + Envoi JSON vers sync_spots)
                System.out.println("🤖 Lancement de l'analyse YOLO...");
                ProcessBuilder pb2 = new ProcessBuilder("python", "generateur_spots.py", fileName, id);
                pb2.directory(new File(scriptDir));
                pb2.inheritIO();
                Process p2 = pb2.start();
                int exitCode2 = p2.waitFor();
                System.out.println("🏁 generateur_spots terminé avec code : " + exitCode2);
            }

            return ResponseEntity.ok(Collections.singletonMap("status", "Analyse lancée avec succès"));

        } catch (Exception e) {
            System.err.println("❌ Erreur : " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}