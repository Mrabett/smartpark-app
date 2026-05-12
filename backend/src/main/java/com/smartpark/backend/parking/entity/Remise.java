package com.smartpark.backend.parking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@Document(collection = "remises")
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Remise {
    @Id
    private String id;

    private double seuilHeures;
    private double pourcentageRemise;
    private String description;

    private Boolean isDeleted = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnoreProperties({"spots", "remises"})
    @DocumentReference(lazy = true)
    private ParkingLot parking;

    @Field("theme_visuel")
    private String themeVisuel;
}
