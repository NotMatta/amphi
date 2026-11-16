package me.matta.amphi.community.repository;

import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityRepository extends JpaRepository<Community, Long> {
    List<Community> findByType(CommunityType type);
    List<Community> findByOwnerId(Long ownerId);
}
