package me.matta.amphi.post.service;

import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.comment.repository.CommentRepository;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.post.dto.PostRequest;
import me.matta.amphi.post.dto.PostResponse;
import me.matta.amphi.post.entity.Post;
import me.matta.amphi.post.repository.PostRepository;
import me.matta.amphi.reaction.repository.CommentLikeRepository;
import me.matta.amphi.reaction.repository.PostLikeRepository;
import me.matta.amphi.user.entity.Role;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final CommunityService communityService;
    private final UserService userService;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;

    public PostService(PostRepository postRepository, CommunityService communityService, UserService userService,
                       PostLikeRepository postLikeRepository, CommentRepository commentRepository,
                       CommentLikeRepository commentLikeRepository) {
        this.postRepository = postRepository;
        this.communityService = communityService;
        this.userService = userService;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
        this.commentLikeRepository = commentLikeRepository;
    }

    @Transactional
    public PostResponse create(Long communityId, PostRequest request) {
        User current = userService.getCurrentUser();
        Community community = communityService.getEntity(communityId);
        communityService.assertCanPost(current, community);
        Post post = new Post();
        post.setTitle(request.title().trim());
        post.setContent(request.content());
        post.setAuthor(current);
        post.setCommunity(community);
        Post saved = postRepository.save(post);
        return toResponse(saved, current);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> listByCommunity(Long communityId) {
        Community community = communityService.getEntity(communityId);
        User current = tryCurrentUser();
        if (community.getType() == CommunityType.PRIVATE) {
            if (current == null) throw new ForbiddenException("You do not have access to this private community");
            communityService.assertCanAccessCommunityContent(current, community);
        }
        return postRepository.findByCommunityIdOrderByCreatedAtDesc(communityId).stream()
                .map(p -> toResponse(p, current)).toList();
    }

    @Transactional(readOnly = true)
    public PostResponse getById(Long postId) {
        Post post = getEntity(postId);
        Community community = post.getCommunity();
        User current = tryCurrentUser();
        if (community.getType() == CommunityType.PRIVATE) {
            if (current == null) throw new ForbiddenException("You do not have access to this private community");
            communityService.assertCanAccessCommunityContent(current, community);
        }
        return toResponse(post, current);
    }

    @Transactional
    public PostResponse update(Long postId, PostRequest request) {
        Post post = getEntity(postId);
        User current = userService.getCurrentUser();
        if (!post.getAuthor().getId().equals(current.getId())) {
            throw new ForbiddenException("You can only edit your own posts");
        }
        post.setTitle(request.title().trim());
        post.setContent(request.content());
        return toResponse(postRepository.save(post), current);
    }

    @Transactional
    public void delete(Long postId) {
        Post post = getEntity(postId);
        User current = userService.getCurrentUser();
        boolean canModerate = current.getRole() == Role.ADMIN || post.getCommunity().getOwner().getId().equals(current.getId());
        if (!post.getAuthor().getId().equals(current.getId()) && !canModerate) {
            throw new ForbiddenException("You cannot delete this post");
        }
        postLikeRepository.deleteByPostId(postId);
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        // delete replies/children likes first by deleting in reverse order of creation is rough; but replies reference parents.
        // simple approach: repeatedly delete leaf comments
        for (int i = comments.size() - 1; i >= 0; i--) {
            Comment c = comments.get(i);
            commentLikeRepository.deleteByCommentId(c.getId());
            commentRepository.delete(c);
        }
        postRepository.delete(post);
    }

    public Post getEntity(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
    }

    private PostResponse toResponse(Post post, User current) {
        long likes = postLikeRepository.countByPostId(post.getId());
        boolean liked = current != null && postLikeRepository.existsByUserIdAndPostId(current.getId(), post.getId());
        return PostResponse.from(post, likes, liked);
    }

    private User tryCurrentUser() {
        try { return userService.getCurrentUser(); } catch (Exception e) { return null; }
    }
}
