package com.smartpark.backend.repository;

import com.smartpark.backend.model.Terrain;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TerrainRepository extends MongoRepository<Terrain, String> {
    List<Terrain> findByType(String type);
    List<Terrain> findByStatut(String statut);
}