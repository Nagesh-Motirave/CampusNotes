package com.campusnoteshub.notes.dto;

/**
 * DTO returned by GET /notes/stats — platform-level stats for the hero section.
 */
public class StatsResponse {

    private long totalNotes;
    private long totalColleges;
    private long totalStudents;

    public StatsResponse() {}

    public StatsResponse(long totalNotes, long totalColleges, long totalStudents) {
        this.totalNotes = totalNotes;
        this.totalColleges = totalColleges;
        this.totalStudents = totalStudents;
    }

    public long getTotalNotes() { return totalNotes; }
    public void setTotalNotes(long totalNotes) { this.totalNotes = totalNotes; }

    public long getTotalColleges() { return totalColleges; }
    public void setTotalColleges(long totalColleges) { this.totalColleges = totalColleges; }

    public long getTotalStudents() { return totalStudents; }
    public void setTotalStudents(long totalStudents) { this.totalStudents = totalStudents; }
}
