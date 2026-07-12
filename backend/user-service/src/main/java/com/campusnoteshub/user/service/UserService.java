package com.campusnoteshub.user.service;

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

<<<<<<< HEAD
=======
        LocalDateTime lastUpdate = user.getLastPointsUpdate() != null ? user.getLastPointsUpdate() : LocalDateTime.now();
        long rank = userRepository.countByPointsGreaterThan(user.getPoints()) + 
                    userRepository.countByPointsEqualsAndLastPointsUpdateBefore(user.getPoints(), lastUpdate) + 1;

>>>>>>> 3af4d8f (admin data fix issue)
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCollege(),
                user.getRole(),
                stats
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

    public long getUserCount() {
        return userRepository.count();
    }

    public long getCollegesCount() {
        Query query = new Query();
        query.addCriteria(Criteria.where("college").exists(true).ne("").ne(null));
        List<String> colleges = mongoTemplate.findDistinct(query, "college", User.class, String.class);
        return colleges.size();
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
