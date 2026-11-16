package me.matta.amphi.studyresource.controller;

import jakarta.validation.Valid;
import me.matta.amphi.studyresource.dto.StudyResourceRequest;
import me.matta.amphi.studyresource.dto.StudyResourceResponse;
import me.matta.amphi.studyresource.service.StudyResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-resources")
public class StudyResourceController {

    private final StudyResourceService service;

    public StudyResourceController(StudyResourceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<StudyResourceResponse>> list(@RequestParam(required = false) Long communityId) {
        return ResponseEntity.ok(service.list(communityId));
    }

    @PostMapping
    public ResponseEntity<StudyResourceResponse> create(@Valid @RequestBody StudyResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyResourceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StudyResourceResponse> update(@PathVariable Long id, @Valid @RequestBody StudyResourceRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
