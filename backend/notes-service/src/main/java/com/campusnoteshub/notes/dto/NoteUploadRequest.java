package com.campusnoteshub.notes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class NoteUploadRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Subject is required")
    private String subject;
    
    @NotNull(message = "Semester is required")
    private Integer semester;
    
    @NotBlank(message = "Year is required")
    private String year;
    
    private String unit;
    
    @NotBlank(message = "College is required")
    private String college;
    
    @NotBlank(message = "University is required")
    private String university;
    
    @NotBlank(message = "Branch is required")
    private String branch;
    
    @NotBlank(message = "Subject Name is required")
    private String subjectName;
    
    @NotBlank(message = "Resource Type is required")
    private String resourceType;
    
    @NotBlank(message = "File URL is required")
    private String fileUrl;
    
    @NotBlank(message = "File Type is required")
    private String fileType;
    
    private boolean isExamImportant;

    // Getters and Setters
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public boolean isExamImportant() { return isExamImportant; }
    public void setExamImportant(boolean examImportant) { isExamImportant = examImportant; }
}
