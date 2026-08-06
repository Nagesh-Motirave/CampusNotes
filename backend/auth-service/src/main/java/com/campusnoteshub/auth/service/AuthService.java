package com.campusnoteshub.auth.service;

import com.campusnoteshub.auth.config.JwtUtil;
import com.campusnoteshub.auth.dto.AuthResponse;
import com.campusnoteshub.auth.dto.LoginRequest;
import com.campusnoteshub.auth.dto.RegisterRequest;
import com.campusnoteshub.auth.model.User;
import com.campusnoteshub.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CollegeResolver collegeResolver;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setCollege(request.getCollege());

        // Resolve or create college and set collegeId
        String collegeId = collegeResolver.findOrCreateCollegeId(request.getCollege());
        user.setCollegeId(collegeId);
        
        if (request.getEmail().toLowerCase().contains("admin")) {
            user.setRole("ADMIN");
        } else {
            user.setRole("USER");
        }

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getCollege(),
                savedUser.getCollegeId(),
                savedUser.getRole()
        );
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Fix empty/null role in database and auto-promote admin emails
        String currentRole = user.getRole(); // getRole() already normalizes empty to "USER"
        boolean needsSave = false;

        if (user.getEmail().toLowerCase().contains("admin") && !"ADMIN".equals(currentRole)) {
            user.setRole("ADMIN");
            needsSave = true;
        }

        // Backfill collegeId for existing users who don't have one yet
        if (user.getCollegeId() == null && user.getCollege() != null && !user.getCollege().isEmpty()) {
            String collegeId = collegeResolver.findOrCreateCollegeId(user.getCollege());
            user.setCollegeId(collegeId);
            needsSave = true;
        }

        // If the raw role field in MongoDB was empty/null, save the normalized value
        if (needsSave) {
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCollege(),
                user.getCollegeId(),
                user.getRole()
        );
    }

    /**
     * Promote a user to ADMIN role by email.
     * In production, this should be protected by an admin-only endpoint.
     */
    public void promoteToAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        user.setRole("ADMIN");
        userRepository.save(user);
    }

    /**
     * Reset a user's password using a secure token.
     */
    public void resetPassword(String token, String newPassword) {
        String email = jwtUtil.validatePasswordResetTokenAndGetEmail(token);
        if (email == null) {
            throw new RuntimeException("Invalid or expired password reset token");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
    
    /**
     * Handle forgot password request.
     * Generates a reset token and sends an email.
     */
    public void forgotPassword(String email) {
        if (!userRepository.existsByEmail(email)) {
            return; // Prevent email enumeration
        }
        
        String token = jwtUtil.generatePasswordResetToken(email);
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Password Reset Request - Campus Notes Hub");
            message.setText("Hello,\n\nWe received a request to reset your password.\n" +
                    "Click the link below to set a new password:\n\n" +
                    resetLink + "\n\n" +
                    "This link is valid for 15 minutes. If you didn't request a password reset, you can safely ignore this email.\n\n" +
                    "Regards,\nCampus Notes Hub Team");
            mailSender.send(message);
        } catch (Exception e) {
            // Log the error in a real app, here we throw it so the user knows
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage());
        }
    }
}
