package me.matta.amphi.membership.dto;

import me.matta.amphi.membership.entity.Membership;
import me.matta.amphi.user.dto.UserResponse;

import java.time.Instant;

public record MembershipResponse(
        UserResponse user,
        Instant joinedAt,
        boolean banned
) {
    public static MembershipResponse from(Membership m) {
        return new MembershipResponse(UserResponse.from(m.getUser()), m.getJoinedAt(), m.isBanned());
    }
}
