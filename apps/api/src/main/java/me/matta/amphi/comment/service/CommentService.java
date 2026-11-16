package me.matta.amphi.comment.service;

import me.matta.amphi.comment.dto.CommentRequest;
import me.matta.amphi.comment.dto.CommentResponse;
import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.comment.repository.CommentRepository;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.post.entity.Post;
import me.matta.amphi.post.service.PostService;
import me.matta.amphi.reaction.repository.CommentLikeRepository;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostService postService;
    private final UserService userService;
    private final CommunityService communityService;
    private final CommentLikeRepository commentLikeRepository;

    public CommentService(CommentRepository commentRepository, PostService postService, UserService userService,
                          CommunityService communityService, CommentLikeRepository commentLikeRepository) {
        this.commentRepository = commentRepository;
        this.postService = postService;
        this.userService = userService;
        this.communityService = communityService;
        this.commentLikeRepository = commentLikeRepository;
    }

    @Transactional
    public CommentResponse createTopLevel(Long postId, CommentRequest request) {
        User current = userService.getCurrentUser();
        Post post = postService.getEntity(postId);
        communityService.assertCanAccessCommunityContent(current, post.getCommunity());
        if (!communityService.isActiveMember(current, post.getCommunity()) && !communityService.canManage(current, post.getCommunity())) {
            throw new ForbiddenException("You must be a member to comment");
        }
        Comment comment = new Comment();
        comment.setContent(request.content());
        comment.setAuthor(current);
        comment.setPost(post);
        return toResponse(commentRepository.save(comment), current);
    }

    @Transactional
    public CommentResponse reply(Long commentId, CommentRequest request) {
        User current = userService.getCurrentUser();
        Comment parent = getEntity(commentId);
        Post post = parent.getPost();
        communityService.assertCanAccessCommunityContent(current, post.getCommunity());
        if (!communityService.isActiveMember(current, post.getCommunity()) && !communityService.canManage(current, post.getCommunity())) {
            throw new ForbiddenException("You must be a member to comment");
        }
        Comment reply = new Comment();
        reply.setContent(request.content());
        reply.setAuthor(current);
        reply.setPost(post);
        reply.setParent(parent);
        return toResponse(commentRepository.save(reply), current);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listByPost(Long postId) {
        Post post = postService.getEntity(postId);
        User current = tryCurrentUser();
        if (post.getCommunity().getType() == CommunityType.PRIVATE) {
            if (current == null) throw new ForbiddenException("You do not have access to this private community");
            communityService.assertCanAccessCommunityContent(current, post.getCommunity());
        } else if (current != null) {
            communityService.assertCanAccessCommunityContent(current, post.getCommunity());
        }
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(c -> toResponse(c, current)).toList();
    }

    @Transactional
    public CommentResponse update(Long commentId, CommentRequest request) {
        Comment comment = getEntity(commentId);
        User current = userService.getCurrentUser();
        if (!comment.getAuthor().getId().equals(current.getId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }
        comment.setContent(request.content());
        return toResponse(commentRepository.save(comment), current);
    }

    @Transactional
    public void delete(Long commentId) {
        Comment comment = getEntity(commentId);
        User current = userService.getCurrentUser();
        boolean canManage = communityService.canManage(current, comment.getPost().getCommunity());
        if (!comment.getAuthor().getId().equals(current.getId()) && !canManage) {
            throw new ForbiddenException("You cannot delete this comment");
        }
        deleteCommentTree(comment);
    }

    @Transactional
    public void deleteCommentTree(Comment comment) {
        Comment current = commentRepository.findById(comment.getId()).orElse(null);
        if (current == null) return;
        for (Comment reply : commentRepository.findByParentId(current.getId())) {
            deleteCommentTree(reply);
        }
        commentLikeRepository.deleteByCommentId(current.getId());
        if (commentRepository.existsById(current.getId())) {
            commentRepository.deleteById(current.getId());
        }
    }

    public Comment getEntity(Long id) {
        return commentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
    }

    private CommentResponse toResponse(Comment c, User current) {
        long likes = commentLikeRepository.countByCommentId(c.getId());
        boolean liked = current != null && commentLikeRepository.existsByUserIdAndCommentId(current.getId(), c.getId());
        return CommentResponse.from(c, likes, liked);
    }

    private User tryCurrentUser() {
        try { return userService.getCurrentUser(); } catch (Exception e) { return null; }
    }
}
