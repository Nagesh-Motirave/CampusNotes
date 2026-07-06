package com.campusnoteshub.user.dto;

public class UserProfileUpdateRequest {
    private String name;
    private String college;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }
}
