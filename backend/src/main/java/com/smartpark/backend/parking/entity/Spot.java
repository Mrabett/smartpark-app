package com.smartpark.backend.parking.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document(collection = "spots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class Spot {
    @Id
    private String id;
    private String nom;
    private String description;
    private StatutSpot statut;
    private Double x;
    private Double y;
    private Boolean isDeleted = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @JsonIgnoreProperties("spots")
    private ParkingLot parking;

    @DocumentReference(lazy = true)
    private List<ParkingReservation> reservationList;
}
