package me.matta.amphi.membership.service;

import me.matta.amphi.common.exception.BadRequestException;
import me.matta.amphi.common.exception.ConflictException;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.invitation.service.InvitationService;
import me.matta.amphi.membership.dto.JoinCommunityRequest;
import me.matta.amphi.membership.entity.Membership;
import me.matta.amphi.membership.repository.MembershipRepository;
import me.matta.amphi.user.dto.UserResponse;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final CommunityService communityService;
    private final InvitationService invitationService;
    private final UserService userService;

    public MembershipService(MembershipRepository membershipRepository,
                             CommunityService communityService,
                             InvitationService invitationService,
                             UserService userService) {
        this.membershipRepository = membershipRepository;
        this.communityService = communityService;
        this.invitationService = invitationService;
        this.userService = userService;
    }

    @Transactional
    public void join(Long communityId, JoinCommunityRequest request) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();

        if (membershipRepository.existsByUserIdAndCommunityId(current.getId(), communityId)) {
            throw new ConflictException("You are already a member of this community");
        }
        if (community.getType() == CommunityType.PRIVATE) {
            String code = request == null ? null : request.invitationCode();
            if (code == null || code.isBlank()) {
                throw new BadRequestException("Invitation code is required for private communities");
            }
            invitationService.requireValidActiveCode(code.trim(), community);
        }
        if (community.getMaxMembers() != null) {
            long count = membershipRepository.countByCommunityId(communityId);
            if (count >= community.getMaxMembers()) {
                throw new BadRequestException("Community has reached maximum member count");
            }
        }
        Membership membership = new Membership();
        membership.setUser(current);
        membership.setCommunity(community);
        membershipRepository.save(membership);
    }

    @Transactional
    public void leave(Long communityId) {
        User current = userService.getCurrentUser();
        Membership membership = membershipRepository.findByUserIdAndCommunityId(current.getId(), communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        if (membership.getCommunity().getOwner().getId().equals(current.getId())) {
            throw new BadRequestException("Community owner cannot leave their own community");
        }
        membershipRepository.delete(membership);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listMembers(Long communityId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (community.getType() == CommunityType.PRIVATE && !communityService.isMember(current, community) && !communityService.canModerate(current, community)) {
            throw new ForbiddenException("You do not have access to this community");
        }
        return membershipRepository.findByCommunityId(communityId).stream()
                .map(m -> UserResponse.from(m.getUser()))
                .toList();
    }

    @Transactional
    public void removeMember(Long communityId, Long userId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (!communityService.canManage(current, community)) {
            throw new ForbiddenException("You cannot manage members of this community");
        }
        if (community.getOwner().getId().equals(userId)) {
            throw new BadRequestException("Cannot remove the community owner");
        }
        Membership membership = membershipRepository.findByUserIdAndCommunityId(userId, communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        membershipRepository.delete(membership);
    }
}
