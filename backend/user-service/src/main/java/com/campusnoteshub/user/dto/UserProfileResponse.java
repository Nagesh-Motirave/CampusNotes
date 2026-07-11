package com.campusnoteshub.user.dto;

import com.campusnoteshub.user.model.User.ActivityLog;

import java.util.List;

public class UserProfileResponse {
    private String id;
    private String name;
    private String email;
    private String college;
    private int points;
    private long rank;
    private String role;
    private UserStats stats;
    private List<ActivityLog> activity;

    public static class UserStats {
        private int notesUploaded;
        private int totalLikes;
        private int totalDownloads;

        public UserStats(int notesUploaded, int totalLikes, int totalDownloads) {
            this.notesUploaded = notesUploaded;
            this.totalLikes = totalLikes;
            this.totalDownloads = totalDownloads;
        }

        public int getNotesUploaded() { return notesUploaded; }
        public int getTotalLikes() { return totalLikes; }
        public int getTotalDownloads() { return totalDownloads; }
    }

    public UserProfileResponse(String id, String name, String email, String college, int points, long rank, String role, UserStats stats, List<ActivityLog> activity) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.college = college;
        this.points = points;
        this.rank = rank;
        this.role = role;
        this.stats = stats;
        this.activity = activity;
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getCollege() { return college; }
    public int getPoints() { return points; }
    public long getRank() { return rank; }
    public String getRole() { return role; }
    public UserStats getStats() { return stats; }
    public List<ActivityLog> getActivity() { return activity; }
}
