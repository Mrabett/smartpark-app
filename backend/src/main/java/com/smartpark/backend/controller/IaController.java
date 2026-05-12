package com.smartpark.backend.controller;

import com.smartpark.backend.dto.ChatRequestDTO;
import com.smartpark.backend.dto.ChatResponseDTO;
import com.smartpark.backend.dto.RecommandationRequestDTO;
import com.smartpark.backend.service.HuggingFaceService;
import com.smartpark.backend.service.IaRecommandationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ia")
@CrossOrigin(origins = "http://localhost:4200")
public class IaController {

    @Autowired private HuggingFaceService       huggingFaceService;
    @Autowired private IaRecommandationService  recommandationService;

    // ✅ POST /api/ia/chat
    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDTO> chat(
            @RequestBody ChatRequestDTO dto) {

        // Classifier l'intention
        String intention =
                huggingFaceService.classerIntention(dto.getMessage());

        // Enrichir le prompt avec le contexte SmartPark
        String promptEnrichi = buildPrompt(
                dto.getMessage(), intention);

        // Générer la réponse
        String reponse =
                huggingFaceService.genererReponse(promptEnrichi);

        return ResponseEntity.ok(
                ChatResponseDTO.builder()
                        .reponse(reponse)
                        .type("chat")
                        .modele("DialoGPT + SmartPark Context")
                        .score(1.0)
                        .build()
        );
    }

    // ✅ POST /api/ia/recommander
    @PostMapping("/recommander")
    public ResponseEntity<List<Map<String, Object>>> recommander(
            @RequestBody RecommandationRequestDTO dto) {
        return ResponseEntity.ok(
                recommandationService.recommander(dto));
    }

    // ✅ GET /api/ia/sentiments
    @GetMapping("/sentiments")
    public ResponseEntity<Map<String, Object>> sentiments() {
        return ResponseEntity.ok(
                recommandationService.analyserAvisClients());
    }

    // ✅ POST /api/ia/analyser-note
    @PostMapping("/analyser-note")
    public ResponseEntity<Map<String, Object>> analyserNote(
            @RequestBody Map<String, String> body) {
        String texte = body.getOrDefault("texte", "");
        if (texte.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erreur", "Texte vide"));
        }
        Map<String, Object> result =
                huggingFaceService.analyserSentiment(texte);
        return ResponseEntity.ok(result);
    }

    // ✅ Construire un prompt enrichi avec le contexte SmartPark
    private String buildPrompt(
            String message, String intention) {
        String contexte =
                "Tu es l'assistant IA de SmartPark, une plateforme "
                        + "de réservation de terrains sportifs en Tunisie. "
                        + "Tu aides les clients avec leurs réservations, "
                        + "les tarifs dynamiques, les terrains disponibles "
                        + "et les horaires. Réponds en français, "
                        + "de façon concise et utile. "
                        + "Intention détectée: " + intention + ". "
                        + "Question: " + message;
        return contexte;
    }
}