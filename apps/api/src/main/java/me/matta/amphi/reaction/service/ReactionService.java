package me.matta.amphi.reaction.service;

import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.comment.service.CommentService;
import me.matta.amphi.common.exception.ConflictException;
import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.post.entity.Post;
import me.matta.amphi.post.service.PostService;
import me.matta.amphi.reaction.entity.CommentLike;
import me.matta.amphi.reaction.entity.PostLike;
import me.matta.amphi.reaction.repository.CommentLikeRepository;
import me.matta.amphi.reaction.repository.PostLikeRepository;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReactionService {

    private final PostLikeRepository postLikeRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostService postService;
    private final CommentService commentService;
    private final UserService userService;
    private final CommunityService communityService;

    public ReactionService(PostLikeRepository postLikeRepository, CommentLikeRepository commentLikeRepository,
                           PostService postService, CommentService commentService, UserService userService,
                           CommunityService communityService) {
        this.postLikeRepository = postLikeRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.postService = postService;
        this.commentService = commentService;
        this.userService = userService;
        this.communityService = communityService;
    }

    @Transactional
    public void likePost(Long postId) {
        User current = userService.getCurrentUser();
        Post post = postService.getEntity(postId);
        assertPostAccess(current, post);
        if (postLikeRepository.existsByUserIdAndPostId(current.getId(), postId)) {
            throw new ConflictException("You already liked this post");
        }
        PostLike like = new PostLike();
        like.setUser(current);
        like.setPost(post);
        postLikeRepository.save(like);
    }

    @Transactional
    public void unlikePost(Long postId) {
        User current = userService.getCurrentUser();
        Post post = postService.getEntity(postId);
        assertPostAccess(current, post);
        PostLike like = postLikeRepository.findByUserIdAndPostId(current.getId(), postId)
                .orElseThrow(() -> new ResourceNotFoundException("Like not found"));
        postLikeRepository.delete(like);
    }

    @Transactional
    public void likeComment(Long commentId) {
        User current = userService.getCurrentUser();
        Comment comment = commentService.getEntity(commentId);
        assertCommentAccess(current, comment);
        if (commentLikeRepository.existsByUserIdAndCommentId(current.getId(), commentId)) {
            throw new ConflictException("You already liked this comment");
        }
        CommentLike like = new CommentLike();
        like.setUser(current);
        like.setComment(comment);
        commentLikeRepository.save(like);
    }

    @Transactional
    public void unlikeComment(Long commentId) {
        User current = userService.getCurrentUser();
        Comment comment = commentService.getEntity(commentId);
        assertCommentAccess(current, comment);
        CommentLike like = commentLikeRepository.findByUserIdAndCommentId(current.getId(), commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Like not found"));
        commentLikeRepository.delete(like);
    }

    private void assertPostAccess(User user, Post post) {
        if (post.getCommunity().getType() == CommunityType.PRIVATE) {
            communityService.assertCanAccessCommunityContent(user, post.getCommunity());
        }
    }

    private void assertCommentAccess(User user, Comment comment) {
        if (comment.getPost().getCommunity().getType() == CommunityType.PRIVATE) {
            communityService.assertCanAccessCommunityContent(user, comment.getPost().getCommunity());
        }
    }
}
