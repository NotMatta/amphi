package me.matta.amphi.invitation.repository;

import me.matta.amphi.invitation.entity.InvitationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitationCodeRepository extends JpaRepository<InvitationCode, Long> {
    Optional<InvitationCode> findByCodeAndActiveTrue(String code);
    Optional<InvitationCode> findByCommunityIdAndActiveTrue(Long communityId);
    List<InvitationCode> findByCommunityId(Long communityId);
    void deleteByCommunityId(Long communityId);
}
