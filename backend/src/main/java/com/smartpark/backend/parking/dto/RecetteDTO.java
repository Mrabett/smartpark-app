package com.smartpark.backend.parking.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RecetteDTO {
    private Map<String, Double> summary;
    private List<HistoryDetail> history;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class HistoryDetail {
        private String date;
        private Long nbVehicules;
        private Double total;
    }
}
