package com.campusnoteshub.user.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    
    private int points = 0;
    
    private boolean verified = false;

    private String role = "USER";
    
    private LocalDateTime createdAt = LocalDateTime.now();

    // Gamification Activity Log
    private List<ActivityLog> activity = new ArrayList<>();

    // Notifications
    private List<Notification> notifications = new ArrayList<>();

    public static class ActivityLog {
        private int points;
        private String description;
        private LocalDateTime date;

        public ActivityLog(int points, String description, LocalDateTime date) {
            this.points = points;
            this.description = description;
            this.date = date;
        }

        public int getPoints() { return points; }
        public String getDescription() { return description; }
        public LocalDateTime getDate() { return date; }
    }

    public static class Notification {
        private String id;
        private String message;
        private String link;
        private boolean isRead = false;
        private LocalDateTime date = LocalDateTime.now();

        public Notification() {
            this.id = java.util.UUID.randomUUID().toString();
        }
        
        public Notification(String message, String link) {
            this();
            this.message = message;
            this.link = link;
        }

        public String getId() { return id; }
        public String getMessage() { return message; }
        public String getLink() { return link; }
        public boolean isRead() { return isRead; }
        public void setRead(boolean read) { isRead = read; }
        public LocalDateTime getDate() { return date; }
    }

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

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public String getRole() { return (role == null || role.isEmpty()) ? "USER" : role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<ActivityLog> getActivity() { return activity; }
    public void addActivity(ActivityLog log) { this.activity.add(0, log); } // Add to start
    
    public List<Notification> getNotifications() { return notifications; }
    public void addNotification(Notification notification) { this.notifications.add(0, notification); }
}
