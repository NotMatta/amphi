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
import me.matta.amphi.membership.dto.MembershipResponse;
import me.matta.amphi.membership.entity.Membership;
import me.matta.amphi.membership.repository.MembershipRepository;
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
    public MembershipResponse join(Long communityId, JoinCommunityRequest request) {
        Community community = communityService.getEntity(communityId);
        return joinInternal(currentUser(), community, request == null ? null : request.invitationCode());
    }

    @Transactional
    public me.matta.amphi.community.dto.CommunityResponse joinByCode(String invitationCode) {
        if (invitationCode == null || invitationCode.isBlank()) {
            throw new BadRequestException("Invitation code is required");
        }
        var invitation = invitationService.getActiveByCode(invitationCode.trim());
        Community community = invitation.getCommunity();
        joinInternal(currentUser(), community, invitationCode.trim());
        return me.matta.amphi.community.dto.CommunityResponse.from(community);
    }

    private MembershipResponse joinInternal(User current, Community community, String invitationCode) {
        if (community.getMaxMembers() != null && membershipRepository.countByCommunityId(community.getId()) >= community.getMaxMembers()) {
            throw new ConflictException("Community has reached maximum members");
        }

        Membership existing = membershipRepository.findByUserIdAndCommunityId(current.getId(), community.getId()).orElse(null);
        if (existing != null) {
            if (existing.isBanned()) {
                throw new ForbiddenException("You are banned from this community");
            }
            throw new ConflictException("You are already a member of this community");
        }

        if (community.getType() == CommunityType.PRIVATE) {
            if (invitationCode == null || invitationCode.isBlank()) {
                throw new BadRequestException("Invitation code is required for private communities");
            }
            invitationService.requireValidActiveCode(invitationCode, community);
        }

        Membership m = new Membership();
        m.setUser(current);
        m.setCommunity(community);
        m.setBanned(false);
        return MembershipResponse.from(membershipRepository.save(m));
    }

    private User currentUser() {
        return userService.getCurrentUser();
    }

    @Transactional(readOnly = true)
    public List<MembershipResponse> listMembers(Long communityId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (!communityService.canManage(current, community)
                && !(communityService.isActiveMember(current, community))
                && community.getType() == CommunityType.PRIVATE) {
            throw new ForbiddenException("You do not have access to this community's members");
        }
        // For public communities, allow viewing members if authenticated? keep permissive for members/managers; public can be viewed by members.
        // If not member and public, require at least being logged in is fine since endpoint is auth-protected by default in our API usage patterns.
        if (community.getType() == CommunityType.PUBLIC && !communityService.canManage(current, community) && !communityService.isActiveMember(current, community)) {
            // allow logged-in users to see members of public communities
        }
        return membershipRepository.findByCommunityId(communityId).stream()
                .map(MembershipResponse::from)
                .toList();
    }

    @Transactional
    public void leave(Long communityId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (community.getOwner().getId().equals(current.getId())) {
            throw new BadRequestException("Community owner cannot leave their own community");
        }
        Membership m = membershipRepository.findByUserIdAndCommunityId(current.getId(), communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        membershipRepository.delete(m);
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
        Membership m = membershipRepository.findByUserIdAndCommunityId(userId, communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        membershipRepository.delete(m);
    }

    @Transactional
    public MembershipResponse banMember(Long communityId, Long userId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (!communityService.canManage(current, community)) {
            throw new ForbiddenException("You cannot manage members of this community");
        }
        if (community.getOwner().getId().equals(userId)) {
            throw new BadRequestException("Cannot ban the community owner");
        }
        Membership m = membershipRepository.findByUserIdAndCommunityId(userId, communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        m.setBanned(true);
        return MembershipResponse.from(membershipRepository.save(m));
    }

    @Transactional
    public MembershipResponse unbanMember(Long communityId, Long userId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (!communityService.canManage(current, community)) {
            throw new ForbiddenException("You cannot manage members of this community");
        }
        Membership m = membershipRepository.findByUserIdAndCommunityId(userId, communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found"));
        m.setBanned(false);
        return MembershipResponse.from(membershipRepository.save(m));
    }
}
