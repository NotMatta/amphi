package me.matta.amphi.studyresource.entity;

import jakarta.persistence.*;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.user.entity.User;

import java.time.Instant;

@Entity
@Table(name = "study_resources")
public class StudyResource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 4000)
    private String description;

    @Column(nullable = false)
    private String moduleName;

    private String attachmentReference;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community; // optional scope

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getModuleName() { return moduleName; }
    public void setModuleName(String moduleName) { this.moduleName = moduleName; }
    public String getAttachmentReference() { return attachmentReference; }
    public void setAttachmentReference(String attachmentReference) { this.attachmentReference = attachmentReference; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public Community getCommunity() { return community; }
    public void setCommunity(Community community) { this.community = community; }
    public Instant getCreatedAt() { return createdAt; }
}
