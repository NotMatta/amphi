package me.matta.amphi.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import me.matta.amphi.user.entity.Role;

public record AdminCreateUserRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, max = 100) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotNull Role role
) {}
