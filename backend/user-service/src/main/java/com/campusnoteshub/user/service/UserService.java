package com.campusnoteshub.user.service;

import com.campusnoteshub.user.dto.LeaderboardEntry;
import com.campusnoteshub.user.dto.UserProfileResponse;
import com.campusnoteshub.user.model.User;
import com.campusnoteshub.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Value("${notes-service.url}")
    private String notesServiceUrl;

    public UserProfileResponse getUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfileResponse.UserStats stats = new UserProfileResponse.UserStats(0, 0, 0);
        try {
            Map<String, Integer> userStats = restTemplate.getForObject(
                    notesServiceUrl + "/notes/users/" + userId + "/stats", Map.class);
            if (userStats != null) {
                stats = new UserProfileResponse.UserStats(
                    userStats.getOrDefault("notesUploaded", 0),
                    userStats.getOrDefault("totalLikes", 0),
                    userStats.getOrDefault("totalDownloads", 0)
                );
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch user stats from notes-service: " + e.getMessage());
        }

        long rank = userRepository.countByPointsGreaterThan(user.getPoints()) + 1;

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCollege(),
                user.getPoints(),
                rank,
                user.getRole(),
                stats,
                user.getActivity()
        );
    }

    public UserProfileResponse updateUserProfile(String userId, com.campusnoteshub.user.dto.UserProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            user.setName(request.getName());
        }
        if (request.getCollege() != null && !request.getCollege().trim().isEmpty()) {
            user.setCollege(request.getCollege());
        }
        
        userRepository.save(user);
        return getUserProfile(userId);
    }

    public List<LeaderboardEntry> getLeaderboard() {
        return userRepository.findTop10ByOrderByPointsDesc().stream()
                .map(u -> new LeaderboardEntry(u.getId(), u.getName(), u.getCollege(), u.getPoints()))
                .collect(Collectors.toList());
    }

    /** Returns the total number of registered users (active students). */
    public long getUserCount() {
        return userRepository.count();
    }

    public long getCollegesCount() {
        Query query = new Query();
        query.addCriteria(Criteria.where("college").exists(true).ne("").ne(null));
        List<String> colleges = mongoTemplate.findDistinct(query, "college", User.class, String.class);
        return colleges.size();
    }

    public void addPoints(String userId, int points, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPoints(user.getPoints() + points);
        user.addActivity(new User.ActivityLog(points, description, LocalDateTime.now()));
        
        userRepository.save(user);
    }

    public void setPoints(String userId, int points) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPoints(points);
        userRepository.save(user);
    }

    public List<User.Notification> getNotifications(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getNotifications();
    }

    public void markNotificationsRead(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.getNotifications().forEach(n -> n.setRead(true));
        userRepository.save(user);
    }

    public void addNotification(String userId, String message, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.addNotification(new User.Notification(message, link));
        userRepository.save(user);
    }
}
