package me.matta.amphi.community.service;

import me.matta.amphi.common.exception.BadRequestException;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.dto.CommunityRequest;
import me.matta.amphi.community.dto.CommunityResponse;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.repository.CommunityRepository;
import me.matta.amphi.membership.entity.Membership;
import me.matta.amphi.membership.repository.MembershipRepository;
import me.matta.amphi.user.entity.Role;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final MembershipRepository membershipRepository;
    private final UserService userService;

    public CommunityService(CommunityRepository communityRepository,
                            MembershipRepository membershipRepository,
                            UserService userService) {
        this.communityRepository = communityRepository;
        this.membershipRepository = membershipRepository;
        this.userService = userService;
    }

    @Transactional
    public CommunityResponse create(CommunityRequest request) {
        User current = userService.getCurrentUser();
        if (request.type() == CommunityType.PRIVATE && current.getRole() == Role.STUDENT) {
            throw new ForbiddenException("Students cannot create private communities");
        }
        Community community = new Community();
        community.setName(request.name().trim());
        community.setDescription(request.description());
        community.setType(request.type());
        community.setOwner(current);
        community.setMaxMembers(request.maxMembers());
        Community saved = communityRepository.save(community);

        Membership ownerMembership = new Membership();
        ownerMembership.setUser(current);
        ownerMembership.setCommunity(saved);
        membershipRepository.save(ownerMembership);

        return CommunityResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> listPublic() {
        return communityRepository.findByType(CommunityType.PUBLIC).stream()
                .map(CommunityResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CommunityResponse getById(Long id) {
        Community community = getEntity(id);
        if (community.getType() == CommunityType.PRIVATE) {
            User current = tryCurrentUser();
            if (current == null || (!isMember(current, community) && !canModerate(current, community))) {
                throw new ForbiddenException("You do not have access to this private community");
            }
        }
        return CommunityResponse.from(community);
    }

    @Transactional
    public CommunityResponse update(Long id, CommunityRequest request) {
        Community community = getEntity(id);
        User current = userService.getCurrentUser();
        if (!canManage(current, community)) {
            throw new ForbiddenException("You cannot manage this community");
        }
        if (request.type() == CommunityType.PRIVATE && current.getRole() == Role.STUDENT && !community.getOwner().getId().equals(current.getId())) {
            throw new ForbiddenException("Students cannot set community to private");
        }
        // Prevent a student owner from converting to private
        if (request.type() == CommunityType.PRIVATE && community.getOwner().getRole() == Role.STUDENT) {
            throw new BadRequestException("A student-owned community cannot be private");
        }
        community.setName(request.name().trim());
        community.setDescription(request.description());
        community.setType(request.type());
        community.setMaxMembers(request.maxMembers());
        return CommunityResponse.from(communityRepository.save(community));
    }

    @Transactional
    public void delete(Long id) {
        Community community = getEntity(id);
        User current = userService.getCurrentUser();
        if (!canManage(current, community) && current.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You cannot delete this community");
        }
        communityRepository.delete(community);
    }

    public Community getEntity(Long id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Community not found"));
    }

    public boolean isMember(User user, Community community) {
        return membershipRepository.existsByUserIdAndCommunityId(user.getId(), community.getId());
    }

    public boolean canManage(User user, Community community) {
        return user.getRole() == Role.ADMIN || community.getOwner().getId().equals(user.getId());
    }

    public boolean canModerate(User user, Community community) {
        return user.getRole() == Role.ADMIN || community.getOwner().getId().equals(user.getId());
    }

    public void assertCanAccessCommunityContent(User user, Community community) {
        if (community.getType() == CommunityType.PRIVATE && !isMember(user, community) && !canModerate(user, community)) {
            throw new ForbiddenException("You do not have access to this private community");
        }
    }

    public void assertCanPost(User user, Community community) {
        assertCanAccessCommunityContent(user, community);
        if (!isMember(user, community) && !canModerate(user, community)) {
            throw new ForbiddenException("You must be a member to post in this community");
        }
    }

    private User tryCurrentUser() {
        try {
            return userService.getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }
}
