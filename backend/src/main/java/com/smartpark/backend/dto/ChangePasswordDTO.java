package com.smartpark.backend.dto;

import lombok.Data;

@Data
public class ChangePasswordDTO {
    private String ancienPassword;
    private String nouveauPassword;
}