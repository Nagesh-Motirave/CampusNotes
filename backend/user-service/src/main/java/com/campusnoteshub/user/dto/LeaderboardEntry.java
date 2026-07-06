package com.campusnoteshub.user.dto;

public class LeaderboardEntry {
    private String id;
    private String name;
    private String college;
    private int points;

    public LeaderboardEntry(String id, String name, String college, int points) {
        this.id = id;
        this.name = name;
        this.college = college;
        this.points = points;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getCollege() { return college; }
    public int getPoints() { return points; }
}
