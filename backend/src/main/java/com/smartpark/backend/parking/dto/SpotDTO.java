package com.smartpark.backend.parking.dto;

import com.smartpark.backend.parking.entity.StatutSpot;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SpotDTO {
    private String id;
    private String nom;
    private String description;
    private StatutSpot statut;
    private Double x;
    private Double y;
    private String parkingId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonProperty("parking")
    public Map<String, String> getParking() {
        if (this.parkingId != null) {
            Map<String, String> p = new HashMap<>();
            p.put("id", this.parkingId);
            return p;
        }
        return null;
    }

    @JsonProperty("parking")
    public void setParking(Map<String, String> parking) {
        if (parking != null && parking.containsKey("id")) {
            this.parkingId = parking.get("id");
        }
    }
}
