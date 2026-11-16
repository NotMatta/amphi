package me.matta.amphi.user.controller;

import jakarta.validation.Valid;
import me.matta.amphi.user.dto.AdminCreateUserRequest;
import me.matta.amphi.user.dto.AdminUpdatePasswordRequest;
import me.matta.amphi.user.dto.ChangePasswordRequest;
import me.matta.amphi.user.dto.UpdateProfileRequest;
import me.matta.amphi.user.dto.UpdateUserRoleRequest;
import me.matta.amphi.user.dto.UserResponse;
import me.matta.amphi.user.service.UserService;
import org.springframework.http.HttpStatus;
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

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount() {
        userService.deleteAccount();
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> listAll() {
        return ResponseEntity.ok(userService.listAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.adminCreateUser(request));
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

    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminUpdatePassword(@PathVariable Long id, @Valid @RequestBody AdminUpdatePasswordRequest request) {
        userService.adminUpdatePassword(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> adminDelete(@PathVariable Long id) {
        userService.adminDeleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
