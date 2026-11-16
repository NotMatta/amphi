package me.matta.amphi.user.service;

import me.matta.amphi.common.exception.BadRequestException;
import me.matta.amphi.common.exception.ResourceNotFoundException;
import me.matta.amphi.user.dto.UpdateUserRoleRequest;
import me.matta.amphi.user.dto.UserResponse;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    public UserResponse getCurrentUserResponse() {
        return UserResponse.from(getCurrentUser());
    }

    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserResponse.from(user);
    }

    public List<UserResponse> listAll() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }

    @Transactional
    public UserResponse updateRole(Long id, UpdateUserRoleRequest request) {
        if (request.role() == null) {
            throw new BadRequestException("Role is required");
        }
        User current = getCurrentUser();
        if (current.getId().equals(id)) {
            throw new BadRequestException("You cannot change your own role");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setRole(request.role());
        return UserResponse.from(userRepository.save(user));
    }
}
