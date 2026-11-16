package me.matta.amphi.invitation.service;

import me.matta.amphi.common.exception.BadRequestException;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.invitation.dto.InvitationCodeResponse;
import me.matta.amphi.invitation.entity.InvitationCode;
import me.matta.amphi.invitation.repository.InvitationCodeRepository;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class InvitationService {

    private final InvitationCodeRepository invitationCodeRepository;
    private final CommunityService communityService;
    private final UserService userService;

    public InvitationService(InvitationCodeRepository invitationCodeRepository,
                             CommunityService communityService,
                             UserService userService) {
        this.invitationCodeRepository = invitationCodeRepository;
        this.communityService = communityService;
        this.userService = userService;
    }

    @Transactional
    public InvitationCodeResponse generate(Long communityId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (community.getType() != CommunityType.PRIVATE) {
            throw new BadRequestException("Invitation codes are only for private communities");
        }
        if (!communityService.canManage(current, community)) {
            throw new ForbiddenException("You cannot manage invitations for this community");
        }
        invitationCodeRepository.findByCommunityId(communityId).forEach(ic -> ic.setActive(false));
        InvitationCode ic = new InvitationCode();
        ic.setCommunity(community);
        ic.setCode(UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        ic.setActive(true);
        return InvitationCodeResponse.from(invitationCodeRepository.save(ic));
    }

    @Transactional(readOnly = true)
    public InvitationCodeResponse getActive(Long communityId) {
        Community community = communityService.getEntity(communityId);
        User current = userService.getCurrentUser();
        if (!communityService.canManage(current, community)) {
            throw new ForbiddenException("You cannot view invitations for this community");
        }
        InvitationCode ic = invitationCodeRepository.findByCommunityIdAndActiveTrue(communityId)
                .orElseThrow(() -> new ResourceNotFoundException("No active invitation code"));
        return InvitationCodeResponse.from(ic);
    }

    @Transactional(readOnly = true)
    public InvitationCode requireValidActiveCode(String code, Community community) {
        InvitationCode ic = invitationCodeRepository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new BadRequestException("Invalid or inactive invitation code"));
        if (!ic.getCommunity().getId().equals(community.getId())) {
            throw new BadRequestException("Invitation code does not belong to this community");
        }
        return ic;
    }
}
