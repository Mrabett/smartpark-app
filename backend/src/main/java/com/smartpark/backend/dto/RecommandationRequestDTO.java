package com.smartpark.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class RecommandationRequestDTO {
    private String sport;          // "football", "tennis"...
    private int nbJoueurs;
    private String niveauJoueur;   // "debutant", "intermediaire", "expert"
    private String momentPrefere;  // "matin", "apres-midi", "soir"
    private double budgetMax;
    private List<String> preferences; // ["eclairage", "vestiaires"...]
}