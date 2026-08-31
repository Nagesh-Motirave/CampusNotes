package com.campusnoteshub.auth.service;

import com.campusnoteshub.auth.config.JwtUtil;
import com.campusnoteshub.auth.dto.AuthResponse;
import com.campusnoteshub.auth.dto.LoginRequest;
import com.campusnoteshub.auth.dto.RegisterRequest;
import com.campusnoteshub.auth.dto.RegistrationOtpRequest;
import com.campusnoteshub.auth.model.RegistrationOtp;
import com.campusnoteshub.auth.model.User;
import com.campusnoteshub.auth.repository.PasswordResetOtpRepository;
import com.campusnoteshub.auth.repository.RegistrationOtpRepository;
import com.campusnoteshub.auth.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

import jakarta.annotation.PostConstruct;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetOtpRepository otpRepository;

    @Autowired
    private RegistrationOtpRepository registrationOtpRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CollegeResolver collegeResolver;

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void fixCorruptedMongoData() {
        // Fix _class mapping issues caused by saving fully qualified class names
        // to a shared database. This ensures user-service doesn't crash on startup/query.
        mongoTemplate.updateMulti(
                new Query(),
                new Update().unset("_class"),
                User.class
        );
    }

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

        String token = jwtUtil.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

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

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        )) {
            throw new RuntimeException("Invalid email or password");
        }

        // Fix empty/null role in database and auto-promote admin emails
        String currentRole = user.getRole();
        boolean needsSave = false;

        if (user.getEmail().toLowerCase().contains("admin")
                && !"ADMIN".equals(currentRole)) {

            user.setRole("ADMIN");
            needsSave = true;
        }

        // Backfill collegeId for existing users who don't have one yet
        if (user.getCollegeId() == null
                && user.getCollege() != null
                && !user.getCollege().isEmpty()) {

            String collegeId =
                    collegeResolver.findOrCreateCollegeId(user.getCollege());

            user.setCollegeId(collegeId);
            needsSave = true;
        }

        // If the raw role field in MongoDB was empty/null, save the normalized value
        if (needsSave) {
            Query query = new Query(
                    Criteria.where("id").is(user.getId())
            );

            Update update = new Update();

            if (user.getRole() != null) {
                update.set("role", user.getRole());
            }

            if (user.getCollegeId() != null) {
                update.set("collegeId", user.getCollegeId());
            }

            mongoTemplate.updateFirst(query, update, User.class);
        }

        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole()
        );

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
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found with email: " + email
                        )
                );

        Query query = new Query(
                Criteria.where("id").is(user.getId())
        );

        Update update = new Update()
                .set("role", "ADMIN");

        mongoTemplate.updateFirst(query, update, User.class);
    }

    /**
     * Handle forgot password request.
     * Generates a 6-digit OTP and returns it for DEMO purposes.
     */
    public String forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return "000000";
        }

        User user = userOpt.get();

        // Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        String otpString = String.valueOf(otpValue);

        // Hash OTP and store it in User entity
        String otpHash = passwordEncoder.encode(otpString);
        LocalDateTime expiresAt =
                LocalDateTime.now().plusMinutes(10);

        Query query = new Query(
                Criteria.where("id").is(user.getId())
        );

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

        if (user.getResetOtpAttempts() != null
                && user.getResetOtpAttempts() >= 5) {

            throw new RuntimeException(
                    "Maximum OTP attempts reached. Please request a new OTP."
            );
        }

        if (user.getResetOtpExpiresAt() != null
                && user.getResetOtpExpiresAt()
                        .isBefore(LocalDateTime.now())) {

            throw new RuntimeException("OTP has expired.");
        }

        if (!passwordEncoder.matches(
                otp,
                user.getResetOtpHash()
        )) {

            int attempts =
                    user.getResetOtpAttempts() != null
                            ? user.getResetOtpAttempts()
                            : 0;

            Query query = new Query(
                    Criteria.where("id").is(user.getId())
            );

            Update update = new Update()
                    .set("resetOtpAttempts", attempts + 1);

            mongoTemplate.updateFirst(query, update, User.class);

            return false;
        }

        return true;
    }

    /**
     * Reset a user's password securely using an OTP.
     */
    public void resetPassword(
            String email,
            String otp,
            String newPassword
    ) {

        if (!verifyOtp(email, otp)) {
            throw new RuntimeException("Invalid OTP.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        Query query = new Query(
                Criteria.where("id").is(user.getId())
        );

        Update update = new Update()
                .set(
                        "passwordHash",
                        passwordEncoder.encode(newPassword)
                )
                .unset("resetOtpHash")
                .unset("resetOtpExpiresAt")
                .unset("resetOtpAttempts");

        mongoTemplate.updateFirst(query, update, User.class);
    }

    // ─── Registration OTP ───────────────────────────────────────────────

    /**
     * Step 1 of OTP-verified registration.
     * Validates the registration data, generates a 6-digit OTP,
     * stores the hashed OTP + registration data in a separate collection,
     * and returns the plain OTP for DEMO purposes.
     */
    public String sendRegistrationOtp(RegistrationOtpRequest request) {
        // Check if email is already registered
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        Optional<RegistrationOtp> existingOpt =
                registrationOtpRepository.findByEmail(request.getEmail());

        // If a pending OTP already exists, enforce resend limit
        if (existingOpt.isPresent()) {
            RegistrationOtp existing = existingOpt.get();

            if (existing.getResendCount() >= 3) {
                throw new RuntimeException(
                        "Too many OTP requests. Please wait 5 minutes before trying again."
                );
            }

            // Update with new OTP and increment resend count
            SecureRandom random = new SecureRandom();
            int otpValue = 100000 + random.nextInt(900000);
            String otpString = String.valueOf(otpValue);

            existing.setOtpHash(passwordEncoder.encode(otpString));
            existing.setExpiresAt(LocalDateTime.now().plusMinutes(5));
            existing.setAttempts(0);
            existing.setResendCount(existing.getResendCount() + 1);
            // Update registration data in case user changed fields
            existing.setName(request.getName());
            existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            existing.setCollege(request.getCollege());

            registrationOtpRepository.save(existing);
            return otpString;
        }

        // First-time OTP for this email
        SecureRandom random = new SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        String otpString = String.valueOf(otpValue);

        RegistrationOtp regOtp = new RegistrationOtp();
        regOtp.setEmail(request.getEmail());
        regOtp.setName(request.getName());
        regOtp.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        regOtp.setCollege(request.getCollege());
        regOtp.setOtpHash(passwordEncoder.encode(otpString));
        regOtp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        regOtp.setAttempts(0);
        regOtp.setResendCount(0);

        registrationOtpRepository.save(regOtp);
        return otpString;
    }

    /**
     * Step 2 of OTP-verified registration.
     * Verifies the OTP, creates the user from stored registration data,
     * cleans up the pending record, and returns an AuthResponse with JWT.
     */
    public AuthResponse verifyRegistrationOtp(String email, String otp) {
        RegistrationOtp regOtp = registrationOtpRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("No pending registration found. Please register again.")
                );

        // Check expiry
        if (regOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
            registrationOtpRepository.deleteByEmail(email);
            throw new RuntimeException("OTP has expired. Please register again.");
        }

        // Check max attempts
        if (regOtp.getAttempts() >= 5) {
            registrationOtpRepository.deleteByEmail(email);
            throw new RuntimeException(
                    "Maximum OTP attempts reached. Please register again."
            );
        }

        // Verify OTP
        if (!passwordEncoder.matches(otp, regOtp.getOtpHash())) {
            regOtp.setAttempts(regOtp.getAttempts() + 1);
            registrationOtpRepository.save(regOtp);
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // Double-check email not taken (race condition guard)
        if (userRepository.existsByEmail(email)) {
            registrationOtpRepository.deleteByEmail(email);
            throw new RuntimeException("Email is already registered");
        }

        // Create user from stored registration data
        User user = new User();
        user.setName(regOtp.getName());
        user.setEmail(email);
        user.setPasswordHash(regOtp.getPasswordHash());
        user.setCollege(regOtp.getCollege());

        String collegeId = collegeResolver.findOrCreateCollegeId(regOtp.getCollege());
        user.setCollegeId(collegeId);

        if (email.toLowerCase().contains("admin")) {
            user.setRole("ADMIN");
        } else {
            user.setRole("USER");
        }

        User savedUser = userRepository.save(user);

        // Clean up pending registration
        registrationOtpRepository.deleteByEmail(email);

        String token = jwtUtil.generateToken(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole()
        );

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
}