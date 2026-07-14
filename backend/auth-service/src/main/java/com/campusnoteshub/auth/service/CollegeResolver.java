package com.campusnoteshub.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Lightweight college resolver for auth-service.
 * Uses MongoTemplate directly to access the shared "colleges" collection
 * (same DB as user-service) without inter-service HTTP calls.
 *
 * Contains the same normalization logic as CollegeService in user-service.
 */
@Component
public class CollegeResolver {

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Normalize a college name for duplicate detection.
     * Must stay in sync with CollegeService.normalizeCollegeName().
     */
    public static String normalizeCollegeName(String raw) {
        if (raw == null) return "";
        String result = raw.trim().toLowerCase();
        result = result.replace(".", "");
        result = result.replaceAll("[^a-z0-9\\s]", "");
        result = result.replaceAll("\\s+", "");
        return result;
    }

    /**
     * Find an existing college by normalized key, or create a new one as "Pending".
     * Returns the college document's _id as a String.
     */
    @SuppressWarnings("unchecked")
    public String findOrCreateCollegeId(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            return null;
        }

        String cleaned = rawName.trim().replaceAll("\\s+", " ");
        String normalizedKey = normalizeCollegeName(cleaned);
        if (normalizedKey.isEmpty()) return null;

        // 1. Exact match by normalizedKey
        Query exactQuery = new Query(Criteria.where("normalizedKey").is(normalizedKey));
        Map<String, Object> existing = (Map<String, Object>) (Object)
                mongoTemplate.findOne(exactQuery, org.bson.Document.class, "colleges");
        if (existing != null) {
            String collegeId = existing.get("_id").toString();
            // Add alias if new
            addAliasIfNew(collegeId, cleaned);
            return collegeId;
        }

        // 2. Prefix match — check if any existing normalizedKey starts with this or vice versa
        if (normalizedKey.length() >= 4) {
            List<org.bson.Document> allColleges = mongoTemplate.findAll(org.bson.Document.class, "colleges");
            for (org.bson.Document doc : allColleges) {
                String existingKey = doc.getString("normalizedKey");
                if (existingKey != null && (existingKey.startsWith(normalizedKey) || normalizedKey.startsWith(existingKey))) {
                    String collegeId = doc.get("_id").toString();
                    addAliasIfNew(collegeId, cleaned);
                    return collegeId;
                }
            }
        }

        // 3. Create new college as "Pending"
        org.bson.Document newCollege = new org.bson.Document();
        newCollege.put("officialName", cleaned);
        newCollege.put("shortName", cleaned.length() > 20 ? generateShortName(cleaned) : cleaned);
        newCollege.put("normalizedKey", normalizedKey);
        newCollege.put("aliases", Collections.singletonList(cleaned));
        newCollege.put("status", "Pending");
        newCollege.put("createdAt", LocalDateTime.now());
        newCollege.put("updatedAt", LocalDateTime.now());

        mongoTemplate.insert(newCollege, "colleges");
        return newCollege.get("_id").toString();
    }

    @SuppressWarnings("unchecked")
    private void addAliasIfNew(String collegeId, String alias) {
        Query query = new Query(Criteria.where("_id").is(collegeId));
        org.bson.Document doc = mongoTemplate.findOne(query, org.bson.Document.class, "colleges");
        if (doc == null) return;

        List<String> aliases = doc.getList("aliases", String.class);
        if (aliases == null) aliases = new ArrayList<>();
        boolean alreadyExists = aliases.stream().anyMatch(a -> a.equalsIgnoreCase(alias));
        if (!alreadyExists) {
            Update update = new Update().push("aliases", alias).set("updatedAt", LocalDateTime.now());
            mongoTemplate.updateFirst(query, update, "colleges");
        }
    }

    private String generateShortName(String fullName) {
        String[] words = fullName.split("\\s+");
        StringBuilder sb = new StringBuilder();
        Set<String> stopWords = Set.of("of", "the", "and", "for", "in", "at", "to");
        for (String word : words) {
            if (!word.isEmpty() && !stopWords.contains(word.toLowerCase())) {
                sb.append(Character.toUpperCase(word.charAt(0)));
            }
        }
        return sb.length() > 0 ? sb.toString() : fullName;
    }
}
