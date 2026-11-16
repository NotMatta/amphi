package me.matta.amphi.user.controller;

import jakarta.validation.Valid;
import me.matta.amphi.user.dto.UpdateUserRoleRequest;
import me.matta.amphi.user.dto.UserResponse;
import me.matta.amphi.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.getCurrentUserResponse());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> listAll() {
        return ResponseEntity.ok(userService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateRole(@PathVariable Long id, @Valid @RequestBody UpdateUserRoleRequest request) {
        return ResponseEntity.ok(userService.updateRole(id, request));
    }
}
