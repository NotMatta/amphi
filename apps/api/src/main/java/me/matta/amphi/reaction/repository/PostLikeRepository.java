package me.matta.amphi.reaction.repository;

import me.matta.amphi.reaction.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);
    Optional<PostLike> findByUserIdAndPostId(Long userId, Long postId);
    long countByPostId(Long postId);
    void deleteByPostId(Long postId);
    List<PostLike> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
