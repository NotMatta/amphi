package me.matta.amphi.comment.entity;

import jakarta.persistence.*;
import me.matta.amphi.post.entity.Post;
import me.matta.amphi.user.entity.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 5000)
    private String content;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @OneToMany(mappedBy = "parent")
    private List<Comment> replies = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
    public Comment getParent() { return parent; }
    public void setParent(Comment parent) { this.parent = parent; }
    public List<Comment> getReplies() { return replies; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
