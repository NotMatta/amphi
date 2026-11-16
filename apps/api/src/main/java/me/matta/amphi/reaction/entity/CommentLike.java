package me.matta.amphi.reaction.entity;

import jakarta.persistence.*;
import me.matta.amphi.comment.entity.Comment;
import me.matta.amphi.user.entity.User;

import java.time.Instant;

@Entity
@Table(name = "comment_likes", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "comment_id"}))
public class CommentLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { if (createdAt == null) createdAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Comment getComment() { return comment; }
    public void setComment(Comment comment) { this.comment = comment; }
    public Instant getCreatedAt() { return createdAt; }
}
