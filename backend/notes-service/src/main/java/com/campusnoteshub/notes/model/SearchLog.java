package com.campusnoteshub.notes.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Stores each search query for analytics.
 * Lightweight — only captures the query text, result count, and optional user ID.
 */
@Document(collection = "search_logs")
public class SearchLog {

    @Id
    private String id;

    private String query;
    private int resultCount;
    private String userId; // nullable for anonymous searches

    private LocalDateTime createdAt = LocalDateTime.now();

    public SearchLog() {}

    public SearchLog(String query, int resultCount, String userId) {
        this.query = query;
        this.resultCount = resultCount;
        this.userId = userId;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public int getResultCount() { return resultCount; }
    public void setResultCount(int resultCount) { this.resultCount = resultCount; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
