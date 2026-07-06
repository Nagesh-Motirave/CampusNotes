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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${notes-service.url}")
    private String notesServiceUrl;

    public UserProfileResponse getUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Fetch stats from notes-service (mocked for now to avoid complex DTOs, but ideally we'd call an endpoint)
        // Since we didn't create a stats endpoint in notes-service yet, we'll just return placeholder stats or compute them
        // For simplicity, let's just initialize stats as 0. In a real scenario, we'd add an endpoint in notes-service to get these stats.
        UserProfileResponse.UserStats stats = new UserProfileResponse.UserStats(0, 0, 0);

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCollege(),
                user.getPoints(),
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

    public void addPoints(String userId, int points, String description) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPoints(user.getPoints() + points);
        user.addActivity(new User.ActivityLog(points, description, LocalDateTime.now()));
        
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
