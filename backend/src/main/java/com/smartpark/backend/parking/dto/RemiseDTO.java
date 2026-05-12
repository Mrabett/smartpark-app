package com.smartpark.backend.parking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Map;
import java.util.HashMap;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RemiseDTO {
    private String id;

    @Min(value = 1, message = "Le seuil doit être d'au moins 1 heure")
    private int seuilHeures;

    @Min(value = 0, message = "Le pourcentage ne peut pas être négatif")
    @Max(value = 100, message = "Le pourcentage ne peut pas dépasser 100%")
    private double pourcentageRemise;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    private String themeVisuel;
    private String parkingId;

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
