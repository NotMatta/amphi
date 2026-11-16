package me.matta.amphi.studyresource.dto;

import jakarta.validation.constraints.NotBlank;

public record StudyResourceRequest(
        @NotBlank String title,
        String description,
        @NotBlank String moduleName,
        String attachmentReference,
        Long communityId
) {}
