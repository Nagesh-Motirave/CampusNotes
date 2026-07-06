package com.campusnoteshub.user.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "study_progress")
@CompoundIndex(name = "user_note_idx", def = "{'userId': 1, 'noteId': 1}", unique = true)
public class StudyProgress {
    
    @Id
    private String id;
    private String userId;
    private String noteId;
    private boolean completed;

    public StudyProgress() {}

    public StudyProgress(String userId, String noteId, boolean completed) {
        this.userId = userId;
        this.noteId = noteId;
        this.completed = completed;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getNoteId() { return noteId; }
    public void setNoteId(String noteId) { this.noteId = noteId; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
}
