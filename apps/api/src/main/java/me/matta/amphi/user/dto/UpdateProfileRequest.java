package me.matta.amphi.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank String firstName,
        @NotBlank String lastName
) {}
