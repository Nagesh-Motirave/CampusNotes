package com.campusnoteshub.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class NoteRequestDTO {
    
    @NotBlank(message = "Subject is required")
    private String subject;
    
    @NotNull(message = "Semester is required")
    private Integer semester;
    
    @NotBlank(message = "Description is required")
    private String description;

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
