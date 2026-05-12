package com.smartpark.backend.parking.service;

import com.smartpark.backend.parking.dto.RecetteDTO;
import com.smartpark.backend.parking.entity.Recette;
import com.smartpark.backend.parking.repository.RecetteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class RecetteServiceImpl implements IRecetteService {
    private final RecetteRepository recetteRepository;

    @Override
    public void enregistrerSortie(Double montant) {
        if (montant == null) montant = 0.0;
        LocalDate today = LocalDate.now();
        String dateTexte = today.format(DateTimeFormatter.ISO_LOCAL_DATE);
        
        Recette recette = recetteRepository.findByDateTexte(dateTexte)
                .orElseGet(() -> recetteRepository.findByDateRecette(today)
                .orElse(Recette.builder()
                        .dateRecette(today)
                        .dateTexte(dateTexte)
                        .montantTotal(0.0)
                        .nbVehiculesSortis(0L)
                        .build()));
        
        // Maj dateTexte (rétrocompatibilité)
        if (recette.getDateTexte() == null) {
            recette.setDateTexte(dateTexte);
        }
                        
        Double currentMontant = recette.getMontantTotal();
        if (currentMontant == null) currentMontant = 0.0;
        
        Long currentNb = recette.getNbVehiculesSortis();
        if (currentNb == null) currentNb = 0L;
        
        recette.setMontantTotal(currentMontant + montant);
        recette.setNbVehiculesSortis(currentNb + 1);
        recetteRepository.save(recette);
    }

    @Override
    public RecetteDTO getStatistiquesGlobales() {
        LocalDate now = LocalDate.now();
        Map<String, Double> summary = new HashMap<>();
        summary.put("today", calculateSum(now, now));
        summary.put("week", calculateSum(now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)), now));
        summary.put("month", calculateSum(now.withDayOfMonth(1), now));
        summary.put("year", calculateSum(now.withDayOfYear(1), now));

        List<RecetteDTO.HistoryDetail> history = recetteRepository.findAllByOrderByDateRecetteDesc().stream()
                .map(r -> new RecetteDTO.HistoryDetail(
                        r.getDateTexte() != null ? r.getDateTexte() : (r.getDateRecette() != null ? r.getDateRecette().toString() : "N/A"),
                        r.getNbVehiculesSortis(),
                        r.getMontantTotal()))
                .collect(Collectors.toList());
        return RecetteDTO.builder().summary(summary).history(history).build();
    }

    private Double calculateSum(LocalDate start, LocalDate end) {
        return recetteRepository.findAll().stream()
                .filter(r -> {
                    LocalDate d;
                    if (r.getDateTexte() != null) {
                        try { d = LocalDate.parse(r.getDateTexte(), DateTimeFormatter.ISO_LOCAL_DATE); }
                        catch (Exception e) { d = r.getDateRecette(); }
                    } else {
                        d = r.getDateRecette();
                    }
                    if (d == null) return false;
                    return (d.isEqual(start) || d.isAfter(start)) && 
                           (d.isEqual(end)   || d.isBefore(end));
                })
                .mapToDouble(r -> r.getMontantTotal() != null ? r.getMontantTotal() : 0.0)
                .sum();
    }
}
