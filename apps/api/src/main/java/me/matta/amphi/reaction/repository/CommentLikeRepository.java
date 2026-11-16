package me.matta.amphi.reaction.repository;

import me.matta.amphi.reaction.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    boolean existsByUserIdAndCommentId(Long userId, Long commentId);
    Optional<CommentLike> findByUserIdAndCommentId(Long userId, Long commentId);
    long countByCommentId(Long commentId);
    void deleteByCommentId(Long commentId);
    List<CommentLike> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
