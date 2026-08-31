package com.campusnoteshub.auth.controller;

import com.campusnoteshub.auth.dto.AuthResponse;
import com.campusnoteshub.auth.dto.LoginRequest;
import com.campusnoteshub.auth.dto.RegisterRequest;
import com.campusnoteshub.auth.dto.ForgotPasswordRequest;
import com.campusnoteshub.auth.dto.VerifyOtpRequest;
import com.campusnoteshub.auth.dto.ResetPasswordRequest;
import com.campusnoteshub.auth.dto.RegistrationOtpRequest;
import com.campusnoteshub.auth.dto.RegistrationVerifyOtpRequest;
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
        String otp = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(java.util.Map.of("message", "OTP sent successfully.", "otp", otp));
    }

    /**
     * Verify OTP.
     */
    @PostMapping("/verify-reset-otp")
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

    // ─── Registration OTP Endpoints ─────────────────────────────────────

    /**
     * Step 1: Send a registration OTP to verify email ownership.
     * Accepts the same registration data (name, email, password, college),
     * validates it, and returns a 6-digit OTP (DEMO: included in response).
     */
    @PostMapping("/register/send-otp")
    public ResponseEntity<java.util.Map<String, String>> sendRegistrationOtp(
            @Valid @RequestBody RegistrationOtpRequest request) {
        authService.sendRegistrationOtp(request);
        return ResponseEntity.ok(java.util.Map.of(
                "message", "A 6-digit verification code has been sent to your email."
        ));
    }

    /**
     * Step 2: Verify the registration OTP and complete account creation.
     * On success, returns the same AuthResponse (JWT + user data) as /auth/register.
     */
    @PostMapping("/register/verify-otp")
    public ResponseEntity<AuthResponse> verifyRegistrationOtp(
            @Valid @RequestBody RegistrationVerifyOtpRequest request) {
        return ResponseEntity.ok(
                authService.verifyRegistrationOtp(request.getEmail(), request.getOtp())
        );
    }
}
