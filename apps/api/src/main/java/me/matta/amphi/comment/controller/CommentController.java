package me.matta.amphi.comment.controller;

import jakarta.validation.Valid;
import me.matta.amphi.comment.dto.CommentRequest;
import me.matta.amphi.comment.dto.CommentResponse;
import me.matta.amphi.comment.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<List<CommentResponse>> listByPost(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.listByPost(postId));
    }

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> create(@PathVariable Long postId, @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.createTopLevel(postId, request));
    }

    @PostMapping("/api/comments/{commentId}/replies")
    public ResponseEntity<CommentResponse> reply(@PathVariable Long commentId, @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.reply(commentId, request));
    }

    @PatchMapping("/api/comments/{commentId}")
    public ResponseEntity<CommentResponse> update(@PathVariable Long commentId, @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(commentService.update(commentId, request));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long commentId) {
        commentService.delete(commentId);
        return ResponseEntity.noContent().build();
    }
}
