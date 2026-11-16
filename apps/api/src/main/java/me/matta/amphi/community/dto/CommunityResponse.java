package me.matta.amphi.community.dto;

import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.user.dto.UserResponse;

import java.time.Instant;

public record CommunityResponse(
        Long id,
        String name,
        String description,
        CommunityType type,
        UserResponse owner,
        Integer maxMembers,
        Instant createdAt
) {
    public static CommunityResponse from(Community c) {
        return new CommunityResponse(
                c.getId(), c.getName(), c.getDescription(), c.getType(),
                UserResponse.from(c.getOwner()), c.getMaxMembers(), c.getCreatedAt());
    }
}
