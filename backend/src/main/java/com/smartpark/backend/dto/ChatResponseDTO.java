package com.smartpark.backend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponseDTO {
    private String reponse;
    private String type;     // "chat" | "recommandation" | "sentiment"
    private double score;
    private String modele;
}