package com.campusnoteshub.user.dto;

public class LeaderboardEntry {
    private String id;
    private String name;
    private String college;
    private int points;
    private int approvedNotes;

    public LeaderboardEntry(String id, String name, String college, int points, int approvedNotes) {
        this.id = id;
        this.name = name;
        this.college = college;
        this.points = points;
        this.approvedNotes = approvedNotes;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getCollege() { return college; }
    public int getPoints() { return points; }
    public int getApprovedNotes() { return approvedNotes; }
}
