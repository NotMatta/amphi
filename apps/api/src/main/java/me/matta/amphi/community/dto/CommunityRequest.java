package me.matta.amphi.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import me.matta.amphi.community.entity.CommunityType;

public record CommunityRequest(
        @NotBlank String name,
        String description,
        @NotNull CommunityType type,
        Integer maxMembers
) {}
