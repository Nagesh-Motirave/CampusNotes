package com.campusnoteshub.user.controller;

import com.campusnoteshub.user.dto.LeaderboardEntry;
import com.campusnoteshub.user.dto.UserProfileResponse;
import com.campusnoteshub.user.repository.UserRepository;
import com.campusnoteshub.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(@PathVariable String id, @RequestBody com.campusnoteshub.user.dto.UserProfileUpdateRequest request) {
        return ResponseEntity.ok(userService.updateUserProfile(id, request));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard() {
        return ResponseEntity.ok(userService.getLeaderboard());
    }

    /** Public endpoint — returns total registered user count for the hero stats section. */
    @GetMapping("/count")
    public Long getUserCount() {
        return userRepository.count();
    }

    @GetMapping("/colleges/count")
    public Long getCollegesCount() {
        return userService.getCollegesCount();
    }

    @GetMapping("/{id}/notifications")
    public ResponseEntity<List<com.campusnoteshub.user.model.User.Notification>> getNotifications(@PathVariable String id) {
        return ResponseEntity.ok(userService.getNotifications(id));
    }

    @PutMapping("/{id}/notifications/read")
    public ResponseEntity<Void> markNotificationsRead(@PathVariable String id) {
        userService.markNotificationsRead(id);
        return ResponseEntity.ok().build();
    }

    // Internal endpoint called by other microservices (e.g. notes-service)
    @PostMapping("/internal/{id}/points")
    public ResponseEntity<Void> addPoints(@PathVariable String id, 
                                          @RequestParam int points, 
                                          @RequestParam String desc) {
        userService.addPoints(id, points, desc);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/{id}/points/set")
    public ResponseEntity<Void> setPoints(@PathVariable String id, 
                                          @RequestParam int points) {
        userService.setPoints(id, points);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/{id}/notifications")
    public ResponseEntity<Void> addNotification(@PathVariable String id,
                                                @RequestParam String message,
                                                @RequestParam(required = false) String link) {
        userService.addNotification(id, message, link);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public String test() {
    return "USER SERVICE WORKING";
    }
}

