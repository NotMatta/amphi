package me.matta.amphi.studyresource.repository;

import me.matta.amphi.studyresource.entity.StudyResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudyResourceRepository extends JpaRepository<StudyResource, Long> {
    List<StudyResource> findByCommunityId(Long communityId);
    List<StudyResource> findByAuthorId(Long authorId);
    void deleteByCommunityId(Long communityId);
    void deleteByAuthorId(Long authorId);
}
