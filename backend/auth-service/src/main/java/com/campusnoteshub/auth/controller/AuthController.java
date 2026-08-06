package com.campusnoteshub.auth.controller;

import com.campusnoteshub.auth.dto.AuthResponse;
import com.campusnoteshub.auth.dto.LoginRequest;
import com.campusnoteshub.auth.dto.RegisterRequest;
import com.campusnoteshub.auth.dto.ForgotPasswordRequest;
import com.campusnoteshub.auth.dto.VerifyOtpRequest;
import com.campusnoteshub.auth.dto.ResetPasswordRequest;
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
     * Handle forgot password request (send OTP).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", "OTP sent successfully."));
    }

    /**
     * Verify OTP.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<java.util.Map<String, Boolean>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        boolean verified = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(java.util.Map.of("verified", verified));
    }

    /**
     * Reset a user's password securely using an OTP.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok(java.util.Map.of("message", "Password updated successfully."));
    }
}
