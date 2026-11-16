package me.matta.amphi.auth.service;

import me.matta.amphi.auth.dto.AuthResponse;
import me.matta.amphi.auth.dto.LoginRequest;
import me.matta.amphi.auth.dto.RegisterRequest;
import me.matta.amphi.common.exception.ConflictException;
import me.matta.amphi.common.security.JwtService;
import me.matta.amphi.user.dto.UserResponse;
import me.matta.amphi.user.entity.Role;
import me.matta.amphi.user.entity.User;
import me.matta.amphi.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email is already registered");
        }
        User user = new User();
        user.setEmail(request.email().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setRole(Role.STUDENT);
        User saved = userRepository.save(user);
        String token = jwtService.generateToken(saved.getEmail(), saved.getRole().name());
        return new AuthResponse(token, UserResponse.from(saved));
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userRepository.findByEmail(email).orElseThrow();
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, UserResponse.from(user));
    }
}
