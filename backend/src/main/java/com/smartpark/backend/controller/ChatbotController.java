package com.smartpark.backend.controller;

import com.smartpark.backend.service.ChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "http://localhost:4200")
public class ChatbotController {

    @Autowired
    private ChatbotService chatbotService;

    @PostMapping("/message")
    public Map<String, Object> sendMessage(
            @RequestBody Map<String, String> body) {
        String message = body.get("message");
        String context = body.getOrDefault("context", "");
        return chatbotService.processMessage(message, context);
    }

    @GetMapping("/suggestions")
    public Map<String, Object> getSuggestions() {
        return chatbotService.getSmartSuggestions();
    }
}