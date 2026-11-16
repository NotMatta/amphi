package me.matta.amphi.comment.dto;

import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.user.dto.UserResponse;

import java.time.Instant;

public record CommentResponse(
        Long id,
        String content,
        Long postId,
        Long parentId,
        UserResponse author,
        Instant createdAt,
        Instant updatedAt,
        long likeCount,
        boolean likedByMe
) {
    public static CommentResponse from(Comment c, long likeCount, boolean likedByMe) {
        return new CommentResponse(
                c.getId(), c.getContent(), c.getPost().getId(),
                c.getParent() == null ? null : c.getParent().getId(),
                UserResponse.from(c.getAuthor()), c.getCreatedAt(), c.getUpdatedAt(),
                likeCount, likedByMe
        );
    }
}
