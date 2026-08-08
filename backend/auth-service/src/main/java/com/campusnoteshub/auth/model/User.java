package com.campusnoteshub.auth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    private String name;
    
    @Indexed(unique = true)
    private String email;
    
    @org.springframework.data.mongodb.core.mapping.Field("password")
    private String passwordHash;
    
    private String college;

    private String collegeId;
    
    private boolean verified = false;

    private String role = "USER";
    
    private LocalDateTime createdAt = LocalDateTime.now();

    private String resetOtpHash;
    
    private LocalDateTime resetOtpExpiresAt;
    
    private Integer resetOtpAttempts;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getCollegeId() { return collegeId; }
    public void setCollegeId(String collegeId) { this.collegeId = collegeId; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getRole() { return (role == null || role.isEmpty()) ? "USER" : role; }
    public void setRole(String role) { this.role = role; }

    public String getResetOtpHash() { return resetOtpHash; }
    public void setResetOtpHash(String resetOtpHash) { this.resetOtpHash = resetOtpHash; }

    public LocalDateTime getResetOtpExpiresAt() { return resetOtpExpiresAt; }
    public void setResetOtpExpiresAt(LocalDateTime resetOtpExpiresAt) { this.resetOtpExpiresAt = resetOtpExpiresAt; }

    public Integer getResetOtpAttempts() { return resetOtpAttempts; }
    public void setResetOtpAttempts(Integer resetOtpAttempts) { this.resetOtpAttempts = resetOtpAttempts; }
}
