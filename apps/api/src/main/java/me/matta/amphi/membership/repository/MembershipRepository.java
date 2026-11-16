package me.matta.amphi.membership.repository;

import me.matta.amphi.membership.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    boolean existsByUserIdAndCommunityId(Long userId, Long communityId);
    Optional<Membership> findByUserIdAndCommunityId(Long userId, Long communityId);
    List<Membership> findByCommunityId(Long communityId);
    long countByCommunityId(Long communityId);
}
