package me.matta.amphi.user.dto;

import jakarta.validation.constraints.NotNull;
import me.matta.amphi.user.entity.Role;

public record UpdateUserRoleRequest(
        @NotNull Role role
) {
}