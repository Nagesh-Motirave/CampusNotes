package com.campusnoteshub.user.dto;

import java.util.List;

/**
 * Typed response DTOs for admin user analytics endpoints.
 */
public class AdminUserAnalyticsDTO {

    public static class OverviewStats {
        private long totalUsers;
        private long verifiedUsers;
        private long adminUsers;
        private long newUsersThisWeek;
        private long newUsersThisMonth;

        public OverviewStats() {}

        public OverviewStats(long totalUsers, long verifiedUsers, long adminUsers,
                             long newUsersThisWeek, long newUsersThisMonth) {
            this.totalUsers = totalUsers;
            this.verifiedUsers = verifiedUsers;
            this.adminUsers = adminUsers;
            this.newUsersThisWeek = newUsersThisWeek;
            this.newUsersThisMonth = newUsersThisMonth;
        }

        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

        public long getVerifiedUsers() { return verifiedUsers; }
        public void setVerifiedUsers(long verifiedUsers) { this.verifiedUsers = verifiedUsers; }

        public long getAdminUsers() { return adminUsers; }
        public void setAdminUsers(long adminUsers) { this.adminUsers = adminUsers; }

        public long getNewUsersThisWeek() { return newUsersThisWeek; }
        public void setNewUsersThisWeek(long newUsersThisWeek) { this.newUsersThisWeek = newUsersThisWeek; }

        public long getNewUsersThisMonth() { return newUsersThisMonth; }
        public void setNewUsersThisMonth(long newUsersThisMonth) { this.newUsersThisMonth = newUsersThisMonth; }
    }

    public static class CollegeUserStat {
        private String college;
        private long userCount;

        public CollegeUserStat() {}

        public CollegeUserStat(String college, long userCount) {
            this.college = college;
            this.userCount = userCount;
        }

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }

        public long getUserCount() { return userCount; }
        public void setUserCount(long userCount) { this.userCount = userCount; }
    }

    public static class RecentUser {
        private String id;
        private String name;
        private String email;
        private String college;
        private String role;
        private String createdAt;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }
}
