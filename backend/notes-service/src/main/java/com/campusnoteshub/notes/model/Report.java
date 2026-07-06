package com.campusnoteshub.notes.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "reports")
public class Report {
    @Id
    private String id;
    private String noteId;
    private String userId;
    private String reason;
    private String status = "PENDING";
    private LocalDateTime createdAt = LocalDateTime.now();

    public Report() {}

    public Report(String noteId, String userId, String reason) {
        this.noteId = noteId;
        this.userId = userId;
        this.reason = reason;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNoteId() { return noteId; }
    public void setNoteId(String noteId) { this.noteId = noteId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
