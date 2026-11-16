package me.matta.amphi.post.controller;

import jakarta.validation.Valid;
import me.matta.amphi.post.dto.PostRequest;
import me.matta.amphi.post.dto.PostResponse;
import me.matta.amphi.post.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/api/communities/{communityId}/posts")
    public ResponseEntity<List<PostResponse>> listByCommunity(@PathVariable Long communityId) {
        return ResponseEntity.ok(postService.listByCommunity(communityId));
    }

    @PostMapping("/api/communities/{communityId}/posts")
    public ResponseEntity<PostResponse> create(@PathVariable Long communityId, @Valid @RequestBody PostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.create(communityId, request));
    }

    @GetMapping("/api/posts/{postId}")
    public ResponseEntity<PostResponse> get(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.getById(postId));
    }

    @PatchMapping("/api/posts/{postId}")
    public ResponseEntity<PostResponse> update(@PathVariable Long postId, @Valid @RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.update(postId, request));
    }

    @DeleteMapping("/api/posts/{postId}")
    public ResponseEntity<Void> delete(@PathVariable Long postId) {
        postService.delete(postId);
        return ResponseEntity.noContent().build();
    }
}
