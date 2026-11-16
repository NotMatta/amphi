package me.matta.amphi.post.repository;

import me.matta.amphi.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByCommunityIdOrderByCreatedAtDesc(Long communityId);
}
