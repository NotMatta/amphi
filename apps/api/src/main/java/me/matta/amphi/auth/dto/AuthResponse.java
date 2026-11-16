package me.matta.amphi.auth.dto;

import me.matta.amphi.user.dto.UserResponse;

public record AuthResponse(String token, UserResponse user) {}
