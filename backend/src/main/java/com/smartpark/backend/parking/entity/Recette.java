package com.smartpark.backend.parking.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDate;

@Document(collection = "recettes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Recette {
    @Id
    private String id;

    @Indexed(unique = true)
    private LocalDate dateRecette; // Legacy ou pour tri avancé

    @Indexed(unique = true)
    private String dateTexte; // yyyy-MM-dd, 100% robuste

    private Double montantTotal;
    private Long nbVehiculesSortis;
}
