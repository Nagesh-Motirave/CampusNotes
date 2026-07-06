package com.campusnoteshub.notes.dto;

import java.util.List;

/**
 * Typed response DTOs for admin analytics endpoints.
 */
public class AdminAnalyticsDTO {

    public static class OverviewStats {
        private long totalUploads;
        private long totalDownloads;
        private long pendingApproval;
        private long openRequests;
        private long totalRequests;

        public OverviewStats() {}

        public OverviewStats(long totalUploads, long totalDownloads, long pendingApproval,
                             long openRequests, long totalRequests) {
            this.totalUploads = totalUploads;
            this.totalDownloads = totalDownloads;
            this.pendingApproval = pendingApproval;
            this.openRequests = openRequests;
            this.totalRequests = totalRequests;
        }

        public long getTotalUploads() { return totalUploads; }
        public void setTotalUploads(long totalUploads) { this.totalUploads = totalUploads; }

        public long getTotalDownloads() { return totalDownloads; }
        public void setTotalDownloads(long totalDownloads) { this.totalDownloads = totalDownloads; }

        public long getPendingApproval() { return pendingApproval; }
        public void setPendingApproval(long pendingApproval) { this.pendingApproval = pendingApproval; }

        public long getOpenRequests() { return openRequests; }
        public void setOpenRequests(long openRequests) { this.openRequests = openRequests; }

        public long getTotalRequests() { return totalRequests; }
        public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
    }

    public static class DailyCount {
        private String date;
        private long count;

        public DailyCount() {}

        public DailyCount(String date, long count) {
            this.date = date;
            this.count = count;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class UploadDownloadStats {
        private List<DailyCount> dailyUploads;
        private long uploadsThisWeek;
        private long uploadsLastWeek;
        private long uploadsThisMonth;
        private long totalDownloads;
        private long totalUploads;

        public List<DailyCount> getDailyUploads() { return dailyUploads; }
        public void setDailyUploads(List<DailyCount> dailyUploads) { this.dailyUploads = dailyUploads; }

        public long getUploadsThisWeek() { return uploadsThisWeek; }
        public void setUploadsThisWeek(long uploadsThisWeek) { this.uploadsThisWeek = uploadsThisWeek; }

        public long getUploadsLastWeek() { return uploadsLastWeek; }
        public void setUploadsLastWeek(long uploadsLastWeek) { this.uploadsLastWeek = uploadsLastWeek; }

        public long getUploadsThisMonth() { return uploadsThisMonth; }
        public void setUploadsThisMonth(long uploadsThisMonth) { this.uploadsThisMonth = uploadsThisMonth; }

        public long getTotalDownloads() { return totalDownloads; }
        public void setTotalDownloads(long totalDownloads) { this.totalDownloads = totalDownloads; }

        public long getTotalUploads() { return totalUploads; }
        public void setTotalUploads(long totalUploads) { this.totalUploads = totalUploads; }
    }

    public static class TopNoteEntry {
        private String id;
        private String title;
        private String subject;
        private long downloads;
        private int likes;
        private String uploaderName;
        private String college;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public long getDownloads() { return downloads; }
        public void setDownloads(long downloads) { this.downloads = downloads; }

        public int getLikes() { return likes; }
        public void setLikes(int likes) { this.likes = likes; }

        public String getUploaderName() { return uploaderName; }
        public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }
    }

    public static class SubjectTrend {
        private String subject;
        private long noteCount;
        private long totalDownloads;
        private long totalLikes;

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public long getNoteCount() { return noteCount; }
        public void setNoteCount(long noteCount) { this.noteCount = noteCount; }

        public long getTotalDownloads() { return totalDownloads; }
        public void setTotalDownloads(long totalDownloads) { this.totalDownloads = totalDownloads; }

        public long getTotalLikes() { return totalLikes; }
        public void setTotalLikes(long totalLikes) { this.totalLikes = totalLikes; }
    }

    public static class PendingNote {
        private String id;
        private String title;
        private String subject;
        private String uploaderName;
        private String college;
        private int semester;
        private String createdAt;
        private long downloads;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getUploaderName() { return uploaderName; }
        public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }

        public int getSemester() { return semester; }
        public void setSemester(int semester) { this.semester = semester; }

        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

        public long getDownloads() { return downloads; }
        public void setDownloads(long downloads) { this.downloads = downloads; }
    }

    public static class SearchQueryStat {
        private String query;
        private long count;

        public SearchQueryStat() {}

        public SearchQueryStat(String query, long count) {
            this.query = query;
            this.count = count;
        }

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }

        public long getCount() { return count; }
        public void setCount(long count) { this.count = count; }
    }

    public static class SearchAnalytics {
        private List<SearchQueryStat> topQueries;
        private List<DailyCount> dailyVolume;
        private long totalSearches;

        public List<SearchQueryStat> getTopQueries() { return topQueries; }
        public void setTopQueries(List<SearchQueryStat> topQueries) { this.topQueries = topQueries; }

        public List<DailyCount> getDailyVolume() { return dailyVolume; }
        public void setDailyVolume(List<DailyCount> dailyVolume) { this.dailyVolume = dailyVolume; }

        public long getTotalSearches() { return totalSearches; }
        public void setTotalSearches(long totalSearches) { this.totalSearches = totalSearches; }
    }

    public static class CollegeStat {
        private String college;
        private long noteCount;
        private long totalDownloads;
        private long totalLikes;

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }

        public long getNoteCount() { return noteCount; }
        public void setNoteCount(long noteCount) { this.noteCount = noteCount; }

        public long getTotalDownloads() { return totalDownloads; }
        public void setTotalDownloads(long totalDownloads) { this.totalDownloads = totalDownloads; }

        public long getTotalLikes() { return totalLikes; }
        public void setTotalLikes(long totalLikes) { this.totalLikes = totalLikes; }
    }

    public static class ActivityEntry {
        private String type;
        private String description;
        private String subject;
        private String college;
        private String timestamp;

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}
