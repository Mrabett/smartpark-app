package com.smartpark.backend.repository;

import com.smartpark.backend.model.Fidelite;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;

public interface FideliteRepository
        extends MongoRepository<Fidelite, String> {
    Optional<Fidelite> findByEmail(String email);
    List<Fidelite> findByNiveau(String niveau);
}