package me.matta.amphi.reaction.controller;

import me.matta.amphi.reaction.service.ReactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ReactionController {

    private final ReactionService reactionService;

    public ReactionController(ReactionService reactionService) {
        this.reactionService = reactionService;
    }

    @PostMapping("/posts/{postId}/likes")
    public ResponseEntity<Void> likePost(@PathVariable Long postId) {
        reactionService.likePost(postId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/posts/{postId}/likes")
    public ResponseEntity<Void> unlikePost(@PathVariable Long postId) {
        reactionService.unlikePost(postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/comments/{commentId}/likes")
    public ResponseEntity<Void> likeComment(@PathVariable Long commentId) {
        reactionService.likeComment(commentId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/comments/{commentId}/likes")
    public ResponseEntity<Void> unlikeComment(@PathVariable Long commentId) {
        reactionService.unlikeComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
