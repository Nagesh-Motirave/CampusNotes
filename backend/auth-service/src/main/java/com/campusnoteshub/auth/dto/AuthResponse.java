package com.campusnoteshub.auth.dto;

public class AuthResponse {
    private String token;
    private String id;
    private String name;
    private String email;
    private String college;
    private String role;

    public AuthResponse(String token, String id, String name, String email, String college, String role) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.college = college;
        this.role = role;
    }

    // Getters
    public String getToken() { return token; }
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getCollege() { return college; }
    public String getRole() { return role; }
}
