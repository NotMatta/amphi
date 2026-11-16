package me.matta.amphi.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUpdatePasswordRequest(
        @NotBlank @Size(min = 6, max = 100) String newPassword
) {}
