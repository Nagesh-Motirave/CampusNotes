package com.campusnoteshub.auth.controller;

import com.campusnoteshub.auth.dto.AuthResponse;
import com.campusnoteshub.auth.dto.LoginRequest;
import com.campusnoteshub.auth.dto.RegisterRequest;
import com.campusnoteshub.auth.dto.ForgotPasswordRequest;
import com.campusnoteshub.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Promote a user to ADMIN role by email.
     * Usage: POST /auth/promote-admin?email=user@example.com
     */
    @PostMapping("/promote-admin")
    public ResponseEntity<java.util.Map<String, String>> promoteToAdmin(@RequestParam String email) {
        authService.promoteToAdmin(email);
        return ResponseEntity.ok(java.util.Map.of("message", "User " + email + " promoted to ADMIN"));
    }

    /**
     * Reset a user's password to fix corrupted hashes.
     * Usage: POST /auth/reset-password?email=user@example.com&password=newpassword
     */
    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@RequestParam String email, @RequestParam String password) {
        authService.resetPassword(email, password);
        return ResponseEntity.ok(java.util.Map.of("message", "Password reset for " + email));
    }

    /**
     * Handle forgot password request.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", "If an account exists, a reset link was sent."));
    }
}
