package com.campusnoteshub.auth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "password_reset_otps")
public class PasswordResetOtp {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String otpHash;

    private LocalDateTime expiryDate;

    private int attempts;

    public PasswordResetOtp() {}

    public PasswordResetOtp(String email, String otpHash, LocalDateTime expiryDate, int attempts) {
        this.email = email;
        this.otpHash = otpHash;
        this.expiryDate = expiryDate;
        this.attempts = attempts;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

    public LocalDateTime getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
}
