package com.smartpark.backend.dto;

import lombok.Data;

@Data
public class ChatRequestDTO {
    private String message;
    private String contexte; // "reservation" | "terrain" | "general"
}