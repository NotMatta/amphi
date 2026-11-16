package me.matta.amphi.membership.entity;

import jakarta.persistence.*;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.user.entity.User;

import java.time.Instant;

@Entity
@Table(name = "memberships", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "community_id"})
})
public class Membership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id", nullable = false)
    private Community community;

    @Column(nullable = false)
    private Instant joinedAt;

    @Column(nullable = false)
    private boolean banned = false;

    @PrePersist
    void onCreate() {
        if (joinedAt == null) joinedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Community getCommunity() { return community; }
    public void setCommunity(Community community) { this.community = community; }
    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
    public boolean isBanned() { return banned; }
    public void setBanned(boolean banned) { this.banned = banned; }
}
