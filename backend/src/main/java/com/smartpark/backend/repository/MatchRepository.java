package com.smartpark.backend.repository;

import com.smartpark.backend.model.Match;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MatchRepository
        extends MongoRepository<Match, String> {

    List<Match> findByStatut(String statut);
    List<Match> findByCreateurId(String createurId);
    List<Match> findBySport(String sport);
    List<Match> findByDate(String date);
}