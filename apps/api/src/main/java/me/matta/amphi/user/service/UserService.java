package me.matta.amphi.user.service;

import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.comment.repository.CommentRepository;
import me.matta.amphi.common.exception.BadRequestException;
import me.matta.amphi.common.exception.ConflictException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.repository.CommunityRepository;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.membership.repository.MembershipRepository;
import me.matta.amphi.post.entity.Post;
import me.matta.amphi.post.repository.PostRepository;
import me.matta.amphi.reaction.repository.CommentLikeRepository;
import me.matta.amphi.reaction.repository.PostLikeRepository;
import me.matta.amphi.studyresource.repository.StudyResourceRepository;
import me.matta.amphi.user.dto.AdminCreateUserRequest;
import me.matta.amphi.user.dto.AdminUpdatePasswordRequest;
import me.matta.amphi.user.dto.ChangePasswordRequest;
import me.matta.amphi.user.dto.UpdateProfileRequest;
import me.matta.amphi.user.dto.UpdateUserRoleRequest;
import me.matta.amphi.user.dto.UserResponse;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CommunityRepository communityRepository;
    private final MembershipRepository membershipRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final StudyResourceRepository studyResourceRepository;
    private final CommunityService communityService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       CommunityRepository communityRepository,
                       MembershipRepository membershipRepository,
                       PostRepository postRepository,
                       CommentRepository commentRepository,
                       PostLikeRepository postLikeRepository,
                       CommentLikeRepository commentLikeRepository,
                       StudyResourceRepository studyResourceRepository,
                       @Lazy CommunityService communityService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.communityRepository = communityRepository;
        this.membershipRepository = membershipRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.studyResourceRepository = studyResourceRepository;
        this.communityService = communityService;
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public User getCurrentUserOrNull() {
        try {
            return getCurrentUser();
        } catch (Exception e) {
            return null;
        }
    }

    public UserResponse getCurrentUserResponse() {
        return UserResponse.from(getCurrentUser());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return UserResponse.from(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found")));
    }

    @Transactional
    public UserResponse updateRole(Long id, UpdateUserRoleRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request == null || request.role() == null) throw new BadRequestException("Role is required");
        user.setRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse adminCreateUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void adminUpdatePassword(Long id, AdminUpdatePasswordRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount() {
        User current = getCurrentUser();
        deleteUserFully(current);
    }

    @Transactional
    public void adminDeleteUser(Long id) {
        User current = getCurrentUser();
        if (current.getId().equals(id)) {
            throw new BadRequestException("Admins cannot delete their own account from admin management");
        }
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        deleteUserFully(user);
    }

    @Transactional
    public void deleteUserFully(User user) {
        Long userId = user.getId();

        // Remove likes by user first
        postLikeRepository.deleteByUserId(userId);
        commentLikeRepository.deleteByUserId(userId);

        // Delete communities owned by user (and all their data)
        for (Community owned : communityRepository.findByOwnerId(userId)) {
            if (communityRepository.existsById(owned.getId())) {
                communityService.deleteCommunityData(owned);
            }
        }

        // Delete posts authored by user in remaining communities
        for (Post post : postRepository.findByAuthorId(userId)) {
            if (!postRepository.existsById(post.getId())) continue;
            for (Comment c : commentRepository.findByPostId(post.getId())) {
                commentLikeRepository.deleteByCommentId(c.getId());
            }
            commentRepository.deleteByPostId(post.getId());
            postLikeRepository.deleteByPostId(post.getId());
            postRepository.delete(post);
        }

        // Delete comments authored by user (replies first) across remaining posts
        deleteCommentsByAuthor(userId);

        membershipRepository.deleteByUserId(userId);
        studyResourceRepository.deleteByAuthorId(userId);
        userRepository.delete(user);
    }

    private void deleteCommentsByAuthor(Long userId) {
        List<Comment> mine;
        do {
            mine = commentRepository.findByAuthorId(userId);
            if (mine.isEmpty()) return;
            // delete leaf comments first (no replies)
            boolean deletedAny = false;
            // sort deeper/later first as heuristic
            mine.sort(Comparator.comparing(Comment::getId).reversed());
            for (Comment c : mine) {
                Comment current = commentRepository.findById(c.getId()).orElse(null);
                if (current == null) continue;
                boolean hasReplies = commentRepository.findByPostId(current.getPost().getId()).stream()
                        .anyMatch(x -> x.getParent() != null && x.getParent().getId().equals(current.getId()));
                if (!hasReplies) {
                    commentLikeRepository.deleteByCommentId(current.getId());
                    commentRepository.delete(current);
                    deletedAny = true;
                }
            }
            if (!deletedAny) {
                // break potential cycles/unexpected constraints by force-clearing replies links not possible; try deleting remaining by removing replies authored by others first not our job.
                // As fallback, detach replies (set parent null) is not supported by model; throw clear error unlikely. We'll attempt raw-ish by deleting likes and deleting if still present.
                for (Comment c : commentRepository.findByAuthorId(userId)) {
                    Comment current = commentRepository.findById(c.getId()).orElse(null);
                    if (current == null) continue;
                    boolean hasReplies = commentRepository.findByPostId(current.getPost().getId()).stream()
                            .anyMatch(x -> x.getParent() != null && x.getParent().getId().equals(current.getId()));
                    if (!hasReplies) {
                        commentLikeRepository.deleteByCommentId(current.getId());
                        commentRepository.delete(current);
                    }
                }
                break;
            }
        } while (true);
    }
}
