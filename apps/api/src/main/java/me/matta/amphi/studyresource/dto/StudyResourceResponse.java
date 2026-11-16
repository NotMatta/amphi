package me.matta.amphi.studyresource.dto;

import me.matta.amphi.studyresource.entity.StudyResource;
import me.matta.amphi.user.dto.UserResponse;

import java.time.Instant;

public record StudyResourceResponse(
        Long id,
        String title,
        String description,
        String moduleName,
        String attachmentReference,
        Long communityId,
        UserResponse author,
        Instant createdAt
) {
    public static StudyResourceResponse from(StudyResource r) {
        return new StudyResourceResponse(
                r.getId(), r.getTitle(), r.getDescription(), r.getModuleName(),
                r.getAttachmentReference(),
                r.getCommunity() == null ? null : r.getCommunity().getId(),
                UserResponse.from(r.getAuthor()), r.getCreatedAt());
    }
}
