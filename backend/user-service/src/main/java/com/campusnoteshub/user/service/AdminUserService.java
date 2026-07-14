package com.campusnoteshub.user.service;

import com.campusnoteshub.user.dto.AdminUserAnalyticsDTO;
import com.campusnoteshub.user.model.College;
import com.campusnoteshub.user.model.User;
import com.campusnoteshub.user.repository.CollegeRepository;
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

    @Autowired
    private CollegeRepository collegeRepository;

    @Value("${NOTES_SERVICE_URL:https://notes-service-production-ca2c.up.railway.app}")
    private String notesServiceUrl;

    public AdminUserAnalyticsDTO.OverviewStats getOverviewStats() {
        LocalDateTime startOfWeek = LocalDate.now()
                .atStartOfDay()
                .minusDays(LocalDate.now().getDayOfWeek().getValue() - 1);
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        return new AdminUserAnalyticsDTO.OverviewStats(
                userRepository.count(),
                userRepository.countByVerifiedTrue(),
                userRepository.countByRole("ADMIN"),
                userRepository.countByCreatedAtAfter(startOfWeek),
                userRepository.countByCreatedAtAfter(startOfMonth)
        );
    }

    public List<AdminUserAnalyticsDTO.CollegeUserStat> getUsersByCollege() {
        List<AdminUserAnalyticsDTO.CollegeUserStat> rawStats = new ArrayList<>();

        // Try aggregating by collegeId first (post-migration)
        Aggregation aggById = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("collegeId").ne(null).ne("")),
                Aggregation.group("collegeId").count().as("userCount")
        );
        AggregationResults<Map> resultsById = mongoTemplate.aggregate(aggById, "users", Map.class);

        if (!resultsById.getMappedResults().isEmpty()) {
            for (Map doc : resultsById.getMappedResults()) {
                String collegeId = String.valueOf(doc.get("_id"));
                String collegeName = collegeId;
                // Resolve official name from colleges collection
                java.util.Optional<College> college = collegeRepository.findById(collegeId);
                if (college.isPresent()) {
                    collegeName = college.get().getOfficialName();
                }
                AdminUserAnalyticsDTO.CollegeUserStat stat = new AdminUserAnalyticsDTO.CollegeUserStat(
                        collegeName, toLong(doc.get("userCount")));
                stat.setCollegeId(collegeId);
                rawStats.add(stat);
            }
        } else {
            // Fallback: aggregate by raw college string (pre-migration)
            Aggregation agg = Aggregation.newAggregation(
                    Aggregation.match(Criteria.where("college").ne(null).ne("")),
                    Aggregation.group("college").count().as("userCount")
            );
            AggregationResults<Map> results = mongoTemplate.aggregate(agg, "users", Map.class);

            for (Map doc : results.getMappedResults()) {
                rawStats.add(new AdminUserAnalyticsDTO.CollegeUserStat(
                        String.valueOf(doc.get("_id")),
                        toLong(doc.get("userCount"))
                ));
            }
        }

        // Apply in-memory mapping to merge duplicates
        Map<String, AdminUserAnalyticsDTO.CollegeUserStat> mergedStats = new java.util.HashMap<>();
        for (AdminUserAnalyticsDTO.CollegeUserStat stat : rawStats) {
            String name = stat.getCollege();
            if (name != null) {
                if (name.equalsIgnoreCase("DGOI") || name.equalsIgnoreCase("Dattkala Group of Institute")) {
                    name = "Dattkala Group of Institute Faculty of Engineering";
                } else if (name.equalsIgnoreCase("GP Yavatmal")) {
                    name = "Government Polytechnic, Yavatmal";
                }
            }

            if (mergedStats.containsKey(name)) {
                AdminUserAnalyticsDTO.CollegeUserStat existing = mergedStats.get(name);
                existing.setUserCount(existing.getUserCount() + stat.getUserCount());
                if (existing.getCollegeId() == null && stat.getCollegeId() != null) {
                    existing.setCollegeId(stat.getCollegeId());
                }
            } else {
                stat.setCollege(name);
                mergedStats.put(name, stat);
            }
        }

        return mergedStats.values().stream()
                .sorted((a, b) -> Long.compare(b.getUserCount(), a.getUserCount()))
                .limit(15)
                .collect(Collectors.toList());
    }

    public List<AdminUserAnalyticsDTO.RecentUser> getRecentUsers() {
        return userRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(u -> {
                    AdminUserAnalyticsDTO.RecentUser entry = new AdminUserAnalyticsDTO.RecentUser();
                    entry.setId(u.getId());
                    entry.setName(u.getName());
                    entry.setEmail(u.getEmail());
                    entry.setCollege(u.getCollege());
                    entry.setRole(u.getRole() != null ? u.getRole() : "USER");
                    entry.setCreatedAt(u.getCreatedAt().toString());
                    return entry;
                })
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

}
