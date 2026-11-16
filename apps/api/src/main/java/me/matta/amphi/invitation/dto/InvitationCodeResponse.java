package me.matta.amphi.invitation.dto;

import me.matta.amphi.invitation.entity.InvitationCode;

import java.time.Instant;

public record InvitationCodeResponse(Long id, String code, boolean active, Instant createdAt, Long communityId) {
    public static InvitationCodeResponse from(InvitationCode ic) {
        return new InvitationCodeResponse(ic.getId(), ic.getCode(), ic.isActive(), ic.getCreatedAt(), ic.getCommunity().getId());
    }
}
