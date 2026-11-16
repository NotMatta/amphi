package me.matta.amphi.community.service;

import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.comment.repository.CommentRepository;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.dto.CommunityRequest;
import me.matta.amphi.community.dto.CommunityResponse;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.repository.CommunityRepository;
import me.matta.amphi.invitation.repository.InvitationCodeRepository;
import me.matta.amphi.membership.entity.Membership;
import me.matta.amphi.membership.repository.MembershipRepository;
import me.matta.amphi.post.entity.Post;
import me.matta.amphi.post.repository.PostRepository;
import me.matta.amphi.reaction.repository.CommentLikeRepository;
import me.matta.amphi.reaction.repository.PostLikeRepository;
import me.matta.amphi.studyresource.repository.StudyResourceRepository;
import me.matta.amphi.user.entity.Role;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final MembershipRepository membershipRepository;
    private final UserService userService;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final InvitationCodeRepository invitationCodeRepository;
    private final StudyResourceRepository studyResourceRepository;

    public CommunityService(CommunityRepository communityRepository,
                            MembershipRepository membershipRepository,
                            UserService userService,
                            PostRepository postRepository,
                            CommentRepository commentRepository,
                            PostLikeRepository postLikeRepository,
                            CommentLikeRepository commentLikeRepository,
                            InvitationCodeRepository invitationCodeRepository,
                            StudyResourceRepository studyResourceRepository) {
        this.communityRepository = communityRepository;
        this.membershipRepository = membershipRepository;
        this.userService = userService;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.invitationCodeRepository = invitationCodeRepository;
        this.studyResourceRepository = studyResourceRepository;
    }

    @Transactional
    public CommunityResponse create(CommunityRequest request) {
        User current = userService.getCurrentUser();
        if (request.type() == CommunityType.PRIVATE && current.getRole() == Role.STUDENT) {
            throw new ForbiddenException("Only professors or admins can create private communities");
        }
        Community c = new Community();
        c.setName(request.name());
        c.setDescription(request.description());
        c.setType(request.type());
        c.setMaxMembers(request.maxMembers());
        c.setOwner(current);
        Community saved = communityRepository.save(c);
        Membership m = new Membership();
        m.setCommunity(saved);
        m.setUser(current);
        m.setBanned(false);
        membershipRepository.save(m);
        return CommunityResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> listPublic() {
        return communityRepository.findByType(CommunityType.PUBLIC).stream().map(CommunityResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> listVisible() {
        User current = userService.getCurrentUserOrNull();
        Map<Long, Community> visible = new LinkedHashMap<>();
        for (Community c : communityRepository.findByType(CommunityType.PUBLIC)) {
            visible.put(c.getId(), c);
        }
        if (current != null) {
            for (Membership m : membershipRepository.findByUserId(current.getId())) {
                Community c = m.getCommunity();
                if (c != null) visible.put(c.getId(), c);
            }
            // owners/admin managers should also see their private communities even if membership edge cases exist
            if (current.getRole() == Role.ADMIN) {
                for (Community c : communityRepository.findAll()) {
                    visible.put(c.getId(), c);
                }
            } else {
                for (Community c : communityRepository.findByOwnerId(current.getId())) {
                    visible.put(c.getId(), c);
                }
            }
        }
        return visible.values().stream()
                .sorted(Comparator.comparing(Community::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(CommunityResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommunityResponse getById(Long id) {
        return CommunityResponse.from(getEntity(id));
    }

    public Community getEntity(Long id) {
        return communityRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Community not found"));
    }

    @Transactional(readOnly = true)
    public void assertCanAccessCommunityContent(User user, Community community) {
        if (isBanned(user, community) && !canManage(user, community)) {
            throw new ForbiddenException("You are banned from this community");
        }
        if (community.getType() == CommunityType.PUBLIC) return;
        if (user == null) throw new ForbiddenException("You do not have access to this private community");
        if (!isActiveMember(user, community) && !canManage(user, community)) {
            throw new ForbiddenException("You do not have access to this private community");
        }
    }

    public boolean isActiveMember(User user, Community community) {
        if (user == null) return false;
        return membershipRepository.existsByUserIdAndCommunityIdAndBannedFalse(user.getId(), community.getId());
    }

    public boolean isMember(User user, Community community) {
        return isActiveMember(user, community);
    }

    public boolean isBanned(User user, Community community) {
        if (user == null) return false;
        return membershipRepository.findByUserIdAndCommunityId(user.getId(), community.getId())
                .map(Membership::isBanned).orElse(false);
    }

    public boolean canManage(User user, Community community) {
        if (user == null) return false;
        return user.getRole() == Role.ADMIN || community.getOwner().getId().equals(user.getId());
    }

    public boolean canModerate(User user, Community community) {
        return canManage(user, community);
    }

    public boolean canPost(User user, Community community) {
        if (isBanned(user, community) && !canManage(user, community)) return false;
        return isActiveMember(user, community) || canManage(user, community);
    }

    @Transactional
    public void deleteCommunity(Long communityId) {
        Community community = getEntity(communityId);
        User current = userService.getCurrentUser();
        if (!canManage(current, community)) {
            throw new ForbiddenException("You cannot delete this community");
        }
        deleteCommunityData(community);
    }

    @Transactional
    public void deleteCommunityData(Community community) {
        Long communityId = community.getId();
        for (Post post : postRepository.findByCommunityId(communityId)) {
            deletePostData(post);
            postRepository.delete(post);
        }
        studyResourceRepository.deleteByCommunityId(communityId);
        invitationCodeRepository.deleteByCommunityId(communityId);
        membershipRepository.deleteByCommunityId(communityId);
        communityRepository.delete(community);
    }

    public void deletePostData(Post post) {
        Long postId = post.getId();
        // delete comment likes and comments safely (children first)
        deleteAllCommentsForPost(postId);
        postLikeRepository.deleteByPostId(postId);
    }

    public void deleteAllCommentsForPost(Long postId) {
        List<Comment> all = commentRepository.findByPostId(postId);
        if (all.isEmpty()) return;
        // delete likes for all comments
        for (Comment c : all) {
            commentLikeRepository.deleteByCommentId(c.getId());
        }
        // delete children before parents
        boolean progress = true;
        while (progress) {
            progress = false;
            List<Comment> remaining = commentRepository.findByPostId(postId);
            if (remaining.isEmpty()) break;
            for (Comment c : remaining) {
                boolean hasChild = commentRepository.findByParentId(c.getId()).stream().findAny().isPresent();
                if (!hasChild) {
                    commentRepository.delete(c);
                    progress = true;
                }
            }
        }
        // fallback
        for (Comment c : commentRepository.findByPostId(postId)) {
            if (commentRepository.existsById(c.getId())) commentRepository.delete(c);
        }
    }
}
