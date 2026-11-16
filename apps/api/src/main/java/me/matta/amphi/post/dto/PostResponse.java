package me.matta.amphi.post.dto;

import me.matta.amphi.post.entity.Post;
import me.matta.amphi.user.dto.UserResponse;

import java.time.Instant;

public record PostResponse(
        Long id,
        String title,
        String content,
        Long communityId,
        UserResponse author,
        Instant createdAt,
        Instant updatedAt,
        long likeCount,
        boolean likedByMe
) {
    public static PostResponse from(Post post, long likeCount, boolean likedByMe) {
        return new PostResponse(
                post.getId(), post.getTitle(), post.getContent(),
                post.getCommunity().getId(), UserResponse.from(post.getAuthor()),
                post.getCreatedAt(), post.getUpdatedAt(), likeCount, likedByMe
        );
    }
}
