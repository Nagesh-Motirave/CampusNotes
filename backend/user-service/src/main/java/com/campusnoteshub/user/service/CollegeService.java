package com.campusnoteshub.user.service;

import com.campusnoteshub.user.model.College;
import com.campusnoteshub.user.model.User;
import com.campusnoteshub.user.repository.CollegeRepository;
import com.campusnoteshub.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service for College Master operations:
 * - Normalization & duplicate detection
 * - Find-or-create logic
 * - Search for autocomplete
 * - Admin: approve, edit, merge, migrate
 */
@Service
public class CollegeService {

    @Autowired
    private CollegeRepository collegeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    // ── Normalization ──────────────────────────────────────────────────

    /**
     * Normalize a college name for duplicate detection.
     * Steps: trim → lowercase → remove dots → remove special chars (keep alphanumeric) → collapse spaces → strip.
     * Examples:
     *   "D.G.O.I."  → "dgoi"
     *   "DGOI"      → "dgoi"
     *   " Dattkala " → "dattkala"
     *   "Dattkala Group of Institute Faculty of Engineering" → "dattkalagroupofinstitutefacultyofengineering"
     */
    public static String normalizeCollegeName(String raw) {
        if (raw == null) return "";
        String result = raw.trim().toLowerCase();
        // Remove dots
        result = result.replace(".", "");
        // Remove special characters (keep alphanumeric and spaces)
        result = result.replaceAll("[^a-z0-9\\s]", "");
        // Collapse multiple spaces into one, then remove all spaces
        result = result.replaceAll("\\s+", "");
        return result;
    }

    // ── Find or Create ─────────────────────────────────────────────────

    /**
     * Find an existing college by normalized key, or create a new one as "Pending".
     * Also checks if the normalized input is a prefix of (or contains) an existing normalized key
     * to catch abbreviation variants like "Dattkala" matching "Dattkala Group of Institute...".
     *
     * @param rawName the raw college name from user input
     * @return the matched or newly created College
     */
    public College findOrCreateCollege(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) {
            return null;
        }

        String cleaned = rawName.trim().replaceAll("\\s+", " ");
        String normalizedKey = normalizeCollegeName(cleaned);

        if (normalizedKey.isEmpty()) {
            return null;
        }

        // 1. Exact normalized key match
        Optional<College> exactMatch = collegeRepository.findByNormalizedKey(normalizedKey);
        if (exactMatch.isPresent()) {
            College college = exactMatch.get();
            // Add this spelling as an alias if not already present
            addAliasIfNew(college, cleaned);
            return college;
        }

        // 2. Prefix match: check if any existing normalizedKey starts with this key or vice versa (min 4 chars)
        if (normalizedKey.length() >= 4) {
            List<College> allColleges = collegeRepository.findAll();
            for (College existing : allColleges) {
                String existingKey = existing.getNormalizedKey();
                if (existingKey != null && (existingKey.startsWith(normalizedKey) || normalizedKey.startsWith(existingKey))) {
                    addAliasIfNew(existing, cleaned);
                    return existing;
                }
            }
        }

        // 3. No match found — create new college as "Pending"
        College college = new College();
        college.setOfficialName(cleaned);
        college.setShortName(cleaned.length() > 20 ? generateShortName(cleaned) : cleaned);
        college.setNormalizedKey(normalizedKey);
        college.setAliases(new ArrayList<>(List.of(cleaned)));
        college.setStatus("Pending");
        college.setCreatedAt(LocalDateTime.now());
        college.setUpdatedAt(LocalDateTime.now());

        return collegeRepository.save(college);
    }

    /**
     * Generate a short name from a long college name by taking initials of each word.
     * "Dattkala Group of Institute Faculty of Engineering" → "DGOIFOE"
     */
    private String generateShortName(String fullName) {
        String[] words = fullName.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty() && !isStopWord(word)) {
                sb.append(Character.toUpperCase(word.charAt(0)));
            }
        }
        return sb.length() > 0 ? sb.toString() : fullName;
    }

    private boolean isStopWord(String word) {
        return Set.of("of", "the", "and", "for", "in", "at", "to").contains(word.toLowerCase());
    }

    private void addAliasIfNew(College college, String alias) {
        if (college.getAliases() == null) {
            college.setAliases(new ArrayList<>());
        }
        boolean alreadyExists = college.getAliases().stream()
                .anyMatch(a -> a.equalsIgnoreCase(alias));
        if (!alreadyExists) {
            college.getAliases().add(alias);
            college.setUpdatedAt(LocalDateTime.now());
            collegeRepository.save(college);
        }
    }

    // ── Search (Autocomplete) ──────────────────────────────────────────

    /**
     * Search colleges by query string. Matches against officialName, shortName, and aliases.
     * Returns up to 15 results for the autocomplete dropdown.
     */
    public List<College> searchColleges(String query) {
        if (query == null || query.trim().isEmpty()) {
            return collegeRepository.findAll().stream().limit(15).collect(Collectors.toList());
        }
        // Escape regex special characters in user input
        String escaped = Pattern.quote(query.trim());
        List<College> results = collegeRepository.searchByQuery(escaped);
        return results.stream().limit(15).collect(Collectors.toList());
    }

    // ── Count ──────────────────────────────────────────────────────────

    /** Get the total number of unique colleges from the colleges collection. */
    public long getCollegesCount() {
        return collegeRepository.findByStatusIgnoreCase("Verified").size();
    }

    // ── Admin: Approve ─────────────────────────────────────────────────

    /** Approve a pending college → set status to "Verified". */
    public College approveCollege(String collegeId) {
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found: " + collegeId));
        college.setStatus("Verified");
        college.setUpdatedAt(LocalDateTime.now());
        return collegeRepository.save(college);
    }

    // ── Admin: Update ──────────────────────────────────────────────────

    /** Update college details (officialName, shortName, aliases, city, state). */
    public College updateCollege(String collegeId, String officialName, String shortName,
                                  List<String> aliases, String city, String state) {
        College college = collegeRepository.findById(collegeId)
                .orElseThrow(() -> new RuntimeException("College not found: " + collegeId));

        if (officialName != null && !officialName.trim().isEmpty()) {
            college.setOfficialName(officialName.trim());
            college.setNormalizedKey(normalizeCollegeName(officialName));
        }
        if (shortName != null) {
            college.setShortName(shortName.trim());
        }
        if (aliases != null) {
            college.setAliases(aliases);
        }
        if (city != null) {
            college.setCity(city.trim());
        }
        if (state != null) {
            college.setState(state.trim());
        }
        college.setUpdatedAt(LocalDateTime.now());
        return collegeRepository.save(college);
    }

    // ── Admin: Merge ───────────────────────────────────────────────────

    /**
     * Merge a duplicate college into a target college.
     * 1. Update all users with duplicateId → targetId
     * 2. Update all users whose college string matches any alias of the duplicate
     * 3. Merge aliases from duplicate into target
     * 4. Delete the duplicate college record
     *
     * @return number of users updated
     */
    public long mergeColleges(String targetId, String duplicateId) {
        College target = collegeRepository.findById(targetId)
                .orElseThrow(() -> new RuntimeException("Target college not found: " + targetId));
        College duplicate = collegeRepository.findById(duplicateId)
                .orElseThrow(() -> new RuntimeException("Duplicate college not found: " + duplicateId));

        if (targetId.equals(duplicateId)) {
            throw new RuntimeException("Cannot merge a college with itself");
        }

        // 1. Update all users referencing the duplicate collegeId
        Query userQuery = new Query(Criteria.where("collegeId").is(duplicateId));
        Update userUpdate = new Update()
                .set("collegeId", targetId)
                .set("college", target.getOfficialName());
        long updatedCount = mongoTemplate.updateMulti(userQuery, userUpdate, User.class).getModifiedCount();

        // 2. Merge aliases
        if (duplicate.getAliases() != null) {
            for (String alias : duplicate.getAliases()) {
                addAliasIfNew(target, alias);
            }
        }
        if (duplicate.getOfficialName() != null) {
            addAliasIfNew(target, duplicate.getOfficialName());
        }
        if (duplicate.getShortName() != null && !duplicate.getShortName().isEmpty()) {
            addAliasIfNew(target, duplicate.getShortName());
        }

        // 3. Delete the duplicate
        collegeRepository.deleteById(duplicateId);

        return updatedCount;
    }

    // ── Admin: Get All ─────────────────────────────────────────────────

    /** Get all colleges (for admin panel listing). */
    public List<College> getAllColleges() {
        return collegeRepository.findAll();
    }

    /** Get all pending colleges. */
    public List<College> getPendingColleges() {
        return collegeRepository.findByStatusIgnoreCase("Pending");
    }

    /** Get a college by ID. */
    public Optional<College> getCollegeById(String id) {
        return collegeRepository.findById(id);
    }

    // ── Data Migration ─────────────────────────────────────────────────

    /**
     * One-time migration: scan all existing users' college strings, group by normalizedKey,
     * create College records, and backfill collegeId on all users.
     *
     * Safe: only adds data, never deletes the original college string field.
     *
     * @return migration report map
     */
    public Map<String, Object> migrateExistingData() {
        // 1. Find all distinct college strings from users
        Query query = new Query();
        query.addCriteria(Criteria.where("college").exists(true).ne("").ne(null));
        List<String> distinctColleges = mongoTemplate.findDistinct(query, "college", User.class, String.class);

        // 2. Group by normalized key
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String college : distinctColleges) {
            String key = normalizeCollegeName(college);
            if (key.isEmpty()) continue;
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(college);
        }

        // 3. Also check prefix matches to group abbreviations with full names
        List<String> keys = new ArrayList<>(groups.keySet());
        Map<String, String> mergeMap = new HashMap<>(); // short key → long key (merge short into long)
        for (int i = 0; i < keys.size(); i++) {
            for (int j = i + 1; j < keys.size(); j++) {
                String a = keys.get(i);
                String b = keys.get(j);
                if (a.length() >= 4 && b.length() >= 4) {
                    if (b.startsWith(a)) {
                        mergeMap.put(a, b);
                    } else if (a.startsWith(b)) {
                        mergeMap.put(b, a);
                    }
                }
            }
        }

        // Apply prefix merges
        for (Map.Entry<String, String> entry : mergeMap.entrySet()) {
            String shortKey = entry.getKey();
            String longKey = entry.getValue();
            if (groups.containsKey(shortKey) && groups.containsKey(longKey)) {
                groups.get(longKey).addAll(groups.get(shortKey));
                groups.remove(shortKey);
            }
        }

        // 4. Create/update College records and update users
        int collegesCreated = 0;
        long usersUpdated = 0;
        List<Map<String, Object>> report = new ArrayList<>();

        for (Map.Entry<String, List<String>> entry : groups.entrySet()) {
            String normalizedKey = entry.getKey();
            List<String> variants = entry.getValue();

            // Check if college already exists
            Optional<College> existing = collegeRepository.findByNormalizedKey(normalizedKey);
            College college;

            if (existing.isPresent()) {
                college = existing.get();
                // Add any new aliases
                for (String variant : variants) {
                    addAliasIfNew(college, variant);
                }
            } else {
                // Pick the longest variant as official name
                String officialName = variants.stream()
                        .max(Comparator.comparingInt(String::length))
                        .orElse(variants.get(0));
                // Pick the shortest as short name
                String shortName = variants.stream()
                        .min(Comparator.comparingInt(String::length))
                        .orElse(officialName);

                college = new College();
                college.setOfficialName(officialName);
                college.setShortName(shortName.length() > 20 ? generateShortName(shortName) : shortName);
                college.setNormalizedKey(normalizedKey);
                college.setAliases(new ArrayList<>(variants));
                college.setStatus("Pending");
                college.setCreatedAt(LocalDateTime.now());
                college.setUpdatedAt(LocalDateTime.now());
                college = collegeRepository.save(college);
                collegesCreated++;
            }

            // Update all users whose college string matches any variant
            for (String variant : variants) {
                Query userQuery = new Query(Criteria.where("college").is(variant)
                        .and("collegeId").exists(false));
                Update userUpdate = new Update().set("collegeId", college.getId());
                long count = mongoTemplate.updateMulti(userQuery, userUpdate, User.class).getModifiedCount();
                usersUpdated += count;
            }

            // Also update users who have a college but no collegeId yet (case-insensitive)
            for (String variant : variants) {
                Query userQuery = new Query(
                        Criteria.where("college").regex("^" + Pattern.quote(variant) + "$", "i")
                                .and("collegeId").is(null));
                Update userUpdate = new Update().set("collegeId", college.getId());
                long count = mongoTemplate.updateMulti(userQuery, userUpdate, User.class).getModifiedCount();
                usersUpdated += count;
            }

            Map<String, Object> groupReport = new LinkedHashMap<>();
            groupReport.put("normalizedKey", normalizedKey);
            groupReport.put("officialName", college.getOfficialName());
            groupReport.put("variants", variants);
            groupReport.put("collegeId", college.getId());
            report.add(groupReport);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalDistinctStrings", distinctColleges.size());
        result.put("uniqueCollegesAfterGrouping", groups.size());
        result.put("collegesCreated", collegesCreated);
        result.put("usersUpdated", usersUpdated);
        result.put("groups", report);
        return result;
    }
}
