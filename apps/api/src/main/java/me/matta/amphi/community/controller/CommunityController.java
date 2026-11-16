package me.matta.amphi.community.controller;

import jakarta.validation.Valid;
import me.matta.amphi.community.dto.CommunityRequest;
import me.matta.amphi.community.dto.CommunityResponse;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.invitation.dto.InvitationCodeResponse;
import me.matta.amphi.invitation.service.InvitationService;
import me.matta.amphi.membership.dto.JoinCommunityRequest;
import me.matta.amphi.membership.service.MembershipService;
import me.matta.amphi.user.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communities")
public class CommunityController {

    private final CommunityService communityService;
    private final MembershipService membershipService;
    private final InvitationService invitationService;

    public CommunityController(CommunityService communityService, MembershipService membershipService, InvitationService invitationService) {
        this.communityService = communityService;
        this.membershipService = membershipService;
        this.invitationService = invitationService;
    }

    @GetMapping
    public ResponseEntity<List<CommunityResponse>> listPublic() {
        return ResponseEntity.ok(communityService.listPublic());
    }

    @PostMapping
    public ResponseEntity<CommunityResponse> create(@Valid @RequestBody CommunityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(communityService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommunityResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(communityService.getById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CommunityResponse> update(@PathVariable Long id, @Valid @RequestBody CommunityRequest request) {
        return ResponseEntity.ok(communityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        communityService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/join")
    public ResponseEntity<Void> join(@PathVariable Long id, @RequestBody(required = false) JoinCommunityRequest request) {
        membershipService.join(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{id}/members/me")
    public ResponseEntity<Void> leave(@PathVariable Long id) {
        membershipService.leave(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<UserResponse>> members(@PathVariable Long id) {
        return ResponseEntity.ok(membershipService.listMembers(id));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        membershipService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invitation")
    public ResponseEntity<InvitationCodeResponse> generateInvitation(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invitationService.generate(id));
    }

    @GetMapping("/{id}/invitation")
    public ResponseEntity<InvitationCodeResponse> getInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(invitationService.getActive(id));
    }
}
