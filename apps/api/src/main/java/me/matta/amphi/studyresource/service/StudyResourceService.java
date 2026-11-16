package me.matta.amphi.studyresource.service;

import me.matta.amphi.common.exception.ForbiddenException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.community.entity.Community;
import me.matta.amphi.community.entity.CommunityType;
import me.matta.amphi.community.service.CommunityService;
import me.matta.amphi.studyresource.dto.StudyResourceRequest;
import me.matta.amphi.studyresource.dto.StudyResourceResponse;
import me.matta.amphi.studyresource.entity.StudyResource;
import me.matta.amphi.studyresource.repository.StudyResourceRepository;
import me.matta.amphi.user.entity.Role;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudyResourceService {

    private final StudyResourceRepository repository;
    private final UserService userService;
    private final CommunityService communityService;

    public StudyResourceService(StudyResourceRepository repository, UserService userService, CommunityService communityService) {
        this.repository = repository;
        this.userService = userService;
        this.communityService = communityService;
    }

    @Transactional
    public StudyResourceResponse create(StudyResourceRequest request) {
        User current = userService.getCurrentUser();
        StudyResource resource = new StudyResource();
        resource.setTitle(request.title().trim());
        resource.setDescription(request.description());
        resource.setModuleName(request.moduleName().trim());
        resource.setAttachmentReference(request.attachmentReference());
        resource.setAuthor(current);
        if (request.communityId() != null) {
            Community community = communityService.getEntity(request.communityId());
            // must be able to access/post in that community context to share resource there
            communityService.assertCanAccessCommunityContent(current, community);
            if (!communityService.isMember(current, community) && !communityService.canModerate(current, community)) {
                throw new ForbiddenException("You must be a member to share resources in this community");
            }
            resource.setCommunity(community);
        }
        return StudyResourceResponse.from(repository.save(resource));
    }

    @Transactional(readOnly = true)
    public List<StudyResourceResponse> list(Long communityId) {
        List<StudyResource> list = (communityId != null) ? repository.findByCommunityId(communityId) : repository.findAll();
        User current = tryCurrentUser();
        return list.stream().filter(r -> canView(r, current)).map(StudyResourceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public StudyResourceResponse getById(Long id) {
        StudyResource resource = getEntity(id);
        User current = tryCurrentUser();
        if (!canView(resource, current)) {
            throw new ForbiddenException("You do not have access to this resource");
        }
        return StudyResourceResponse.from(resource);
    }

    @Transactional
    public StudyResourceResponse update(Long id, StudyResourceRequest request) {
        StudyResource resource = getEntity(id);
        User current = userService.getCurrentUser();
        if (!resource.getAuthor().getId().equals(current.getId())) {
            throw new ForbiddenException("You can only edit your own study resources");
        }
        resource.setTitle(request.title().trim());
        resource.setDescription(request.description());
        resource.setModuleName(request.moduleName().trim());
        resource.setAttachmentReference(request.attachmentReference());
        // keep existing community scope simple (no reassignment in MVP) unless null->same
        return StudyResourceResponse.from(repository.save(resource));
    }

    @Transactional
    public void delete(Long id) {
        StudyResource resource = getEntity(id);
        User current = userService.getCurrentUser();
        boolean canModerate = current.getRole() == Role.ADMIN || (resource.getCommunity() != null && resource.getCommunity().getOwner().getId().equals(current.getId()));
        if (!resource.getAuthor().getId().equals(current.getId()) && !canModerate) {
            throw new ForbiddenException("You cannot delete this study resource");
        }
        repository.delete(resource);
    }

    public StudyResource getEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Study resource not found"));
    }

    private boolean canView(StudyResource r, User current) {
        if (r.getCommunity() == null) return true; // global resource
        if (r.getCommunity().getType() == CommunityType.PUBLIC) return true;
        if (current == null) return false;
        return communityService.isMember(current, r.getCommunity()) || communityService.canModerate(current, r.getCommunity());
    }

    private User tryCurrentUser() {
        try { return userService.getCurrentUser(); } catch (Exception e) { return null; }
    }
}
