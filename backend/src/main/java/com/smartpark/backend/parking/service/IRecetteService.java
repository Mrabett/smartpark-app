package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.RecetteDTO;

public interface IRecetteService {
    void enregistrerSortie(Double montant);
    RecetteDTO getStatistiquesGlobales();
}
