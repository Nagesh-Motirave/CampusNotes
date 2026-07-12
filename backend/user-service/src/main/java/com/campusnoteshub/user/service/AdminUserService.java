package com.campusnoteshub.user.service;

import com.campusnoteshub.user.dto.AdminUserAnalyticsDTO;
import com.campusnoteshub.user.model.User;
import com.campusnoteshub.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for admin user analytics and management.
 */
@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${NOTES_SERVICE_URL:https://notes-service-production-ca2c.up.railway.app}")
    private String notesServiceUrl;

    public AdminUserAnalyticsDTO.OverviewStats getOverviewStats() {
        LocalDateTime startOfWeek = LocalDate.now()
                .atStartOfDay()
                .minusDays(LocalDate.now().getDayOfWeek().getValue() - 1);
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.group().sum("points").as("totalPoints")
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "users", Map.class);
        long totalPoints = 0;
        if (!results.getMappedResults().isEmpty()) {
            totalPoints = toLong(results.getMappedResults().get(0).get("totalPoints"));
        }

        return new AdminUserAnalyticsDTO.OverviewStats(
                userRepository.count(),
                userRepository.countByVerifiedTrue(),
                userRepository.countByRole("ADMIN"),
                userRepository.countByCreatedAtAfter(startOfWeek),
                userRepository.countByCreatedAtAfter(startOfMonth),
                totalPoints
        );
    }

    public List<AdminUserAnalyticsDTO.CollegeUserStat> getUsersByCollege() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("college").ne(null).ne("")),
                Aggregation.group("college")
                        .count().as("userCount")
                        .sum("points").as("totalPoints"),
                Aggregation.sort(Sort.Direction.DESC, "userCount"),
                Aggregation.limit(15)
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "users", Map.class);

        List<AdminUserAnalyticsDTO.CollegeUserStat> stats = new ArrayList<>();
        for (Map doc : results.getMappedResults()) {
            stats.add(new AdminUserAnalyticsDTO.CollegeUserStat(
                    String.valueOf(doc.get("_id")),
                    toLong(doc.get("userCount")),
                    toLong(doc.get("totalPoints"))
            ));
        }
        return stats;
    }

    public List<AdminUserAnalyticsDTO.RecentUser> getRecentUsers() {
        return userRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(u -> {
                    AdminUserAnalyticsDTO.RecentUser entry = new AdminUserAnalyticsDTO.RecentUser();
                    entry.setId(u.getId());
                    entry.setName(u.getName());
                    entry.setEmail(u.getEmail());
                    entry.setCollege(u.getCollege());
                    entry.setPoints(u.getPoints());
                    entry.setRank(userRepository.countByPointsGreaterThan(u.getPoints()) + 
                                  userRepository.countByPointsEqualsAndLastPointsUpdateBefore(u.getPoints(), u.getLastPointsUpdate()) + 1);
                    entry.setRole(u.getRole() != null ? u.getRole() : "USER");
                    entry.setCreatedAt(u.getCreatedAt().toString());
                    return entry;
                })
                .collect(Collectors.toList());
    }

    public List<AdminUserAnalyticsDTO.TopContributor> getTopContributors() {
        return userRepository.findTop10ByOrderByPointsDescLastPointsUpdateAsc(org.springframework.data.domain.PageRequest.of(0, 10)).stream()
                .map(u -> new AdminUserAnalyticsDTO.TopContributor(
                        u.getId(), u.getName(), u.getCollege(), u.getPoints(), 
                        userRepository.countByPointsGreaterThan(u.getPoints()) + userRepository.countByPointsEqualsAndLastPointsUpdateBefore(u.getPoints(), u.getLastPointsUpdate()) + 1))
                .collect(Collectors.toList());
    }

    public User updateUserRole(String userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private long toLong(Object value) {
        if (value instanceof Number) return ((Number) value).longValue();
        return 0;
    }

    /**
     * Performs a one-time migration to fix user points.
     * Hits notes-service to get points based strictly on approved notes.
     */
    public Map<String, Object> migratePoints() {
        try {
            // Fetch points summary from notes-service
            String url = notesServiceUrl + "/notes/internal/points-summary";
            System.out.println("Calling Notes Service: " + notesServiceUrl + "/notes/internal/points-summary");
            Map<String, Integer> pointsMap = restTemplate.getForObject(url, Map.class);
            if (pointsMap == null) pointsMap = new java.util.HashMap<>();

            List<User> users = userRepository.findAll();
            int updatedCount = 0;

            for (User user : users) {
                int correctPoints = pointsMap.getOrDefault(user.getId(), 0);
                if (user.getPoints() != correctPoints) {
                    user.setPoints(correctPoints);
                    userRepository.save(user);
                    updatedCount++;
                }
            }

            return Map.of("message", "Migration successful", "updatedCount", updatedCount);
        } catch (Exception e) {
            throw new RuntimeException("Migration failed: " + e.getMessage(), e);
        }
    }
}
