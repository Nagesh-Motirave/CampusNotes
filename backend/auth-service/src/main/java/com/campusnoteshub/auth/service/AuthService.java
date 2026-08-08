package com.campusnoteshub.auth.service;

import com.campusnoteshub.auth.config.JwtUtil;
import com.campusnoteshub.auth.dto.AuthResponse;
import com.campusnoteshub.auth.dto.LoginRequest;
import com.campusnoteshub.auth.dto.RegisterRequest;
import com.campusnoteshub.auth.model.PasswordResetOtp;
import com.campusnoteshub.auth.model.User;
import com.campusnoteshub.auth.repository.PasswordResetOtpRepository;
import com.campusnoteshub.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetOtpRepository otpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CollegeResolver collegeResolver;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private MongoTemplate mongoTemplate;

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
            Query query = new Query(Criteria.where("id").is(user.getId()));
            Update update = new Update();
            if (user.getRole() != null) {
                update.set("role", user.getRole());
            }
            if (user.getCollegeId() != null) {
                update.set("collegeId", user.getCollegeId());
            }
            mongoTemplate.updateFirst(query, update, User.class);
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
        
        Query query = new Query(Criteria.where("id").is(user.getId()));
        Update update = new Update().set("role", "ADMIN");
        mongoTemplate.updateFirst(query, update, User.class);
    }

    /**
     * Handle forgot password request.
     * Generates a 6-digit OTP and returns it for DEMO purposes.
     */
    public String forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return "000000"; // Prevent email enumeration by returning a dummy OTP
        }
        
        User user = userOpt.get();

        // Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        String otpString = String.valueOf(otpValue);
        
        // Hash OTP and store it in User entity
        String otpHash = passwordEncoder.encode(otpString);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);
        
        Query query = new Query(Criteria.where("id").is(user.getId()));
        Update update = new Update()
                .set("resetOtpHash", otpHash)
                .set("resetOtpExpiresAt", expiresAt)
                .set("resetOtpAttempts", 0);
        mongoTemplate.updateFirst(query, update, User.class);
        
        return otpString;
    }

    /**
     * Verify OTP.
     */
    public boolean verifyOtp(String email, String otp) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        if (user.getResetOtpHash() == null) {
            return false;
        }

        if (user.getResetOtpAttempts() != null && user.getResetOtpAttempts() >= 5) {
            throw new RuntimeException("Maximum OTP attempts reached. Please request a new OTP.");
        }

        if (user.getResetOtpExpiresAt() != null && user.getResetOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired.");
        }

        if (!passwordEncoder.matches(otp, user.getResetOtpHash())) {
            int attempts = user.getResetOtpAttempts() != null ? user.getResetOtpAttempts() : 0;
            
            Query query = new Query(Criteria.where("id").is(user.getId()));
            Update update = new Update().set("resetOtpAttempts", attempts + 1);
            mongoTemplate.updateFirst(query, update, User.class);
            return false;
        }

        return true;
    }

    /**
     * Reset a user's password securely using an OTP.
     */
    public void resetPassword(String email, String otp, String newPassword) {
        if (!verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid OTP.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Query query = new Query(Criteria.where("id").is(user.getId()));
        Update update = new Update()
                .set("password", passwordEncoder.encode(newPassword))
                .unset("resetOtpHash")
                .unset("resetOtpExpiresAt")
                .unset("resetOtpAttempts");
        mongoTemplate.updateFirst(query, update, User.class);
    }
}
