package com.smartpark.backend.repository;

import com.smartpark.backend.model.Abonnement;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface AbonnementRepository
        extends MongoRepository<Abonnement, String> {
    Optional<Abonnement> findByEmailAndActif(
            String email, boolean actif);
    List<Abonnement> findByEmail(String email);
}