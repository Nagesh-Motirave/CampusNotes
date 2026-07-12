package com.campusnoteshub.user.dto;

public class UserProfileResponse {
    private String id;
    private String name;
    private String email;
    private String college;
    private String role;
    private UserStats stats;

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

    public UserProfileResponse(String id, String name, String email, String college, String role, UserStats stats) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.college = college;
        this.role = role;
        this.stats = stats;
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getCollege() { return college; }
    public String getRole() { return role; }
    public UserStats getStats() { return stats; }
}
