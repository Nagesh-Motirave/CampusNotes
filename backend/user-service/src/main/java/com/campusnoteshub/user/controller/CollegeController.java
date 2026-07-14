package com.campusnoteshub.user.controller;

import com.campusnoteshub.user.model.College;
import com.campusnoteshub.user.service.CollegeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * College endpoints:
 * - Public: search (autocomplete), count
 * - Admin: list, pending, approve, edit, merge, migrate
 */
@RestController
@RequestMapping("/users")
public class CollegeController {

    @Autowired
    private CollegeService collegeService;

    // ── Public Endpoints ───────────────────────────────────────────────

    /**
     * Autocomplete search — matches officialName, shortName, aliases.
     * GET /users/colleges/search?q=dattkala
     */
    @GetMapping("/colleges/search")
    public ResponseEntity<List<College>> searchColleges(@RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(collegeService.searchColleges(query));
    }

    /**
     * Accurate college count from the colleges collection.
     * GET /users/colleges/count
     */
    @GetMapping("/colleges/count")
    public Long getCollegesCount() {
        return collegeService.getCollegesCount();
    }

    // ── Admin Endpoints ────────────────────────────────────────────────

    private boolean isAdmin(String role) {
        return "ADMIN".equalsIgnoreCase(role);
    }

    /** GET /users/admin/colleges — list all colleges */
    @GetMapping("/admin/colleges")
    public ResponseEntity<?> getAllColleges(
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(collegeService.getAllColleges());
    }

    /** GET /users/admin/colleges/pending — list pending colleges */
    @GetMapping("/admin/colleges/pending")
    public ResponseEntity<?> getPendingColleges(
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(collegeService.getPendingColleges());
    }

    /** PUT /users/admin/colleges/{id}/approve — approve a pending college */
    @PutMapping("/admin/colleges/{id}/approve")
    public ResponseEntity<?> approveCollege(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(collegeService.approveCollege(id));
    }

    /** PUT /users/admin/colleges/{id} — update college details */
    @PutMapping("/admin/colleges/{id}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> updateCollege(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        String officialName = (String) body.get("officialName");
        String shortName = (String) body.get("shortName");
        List<String> aliases = (List<String>) body.get("aliases");
        String city = (String) body.get("city");
        String state = (String) body.get("state");

        return ResponseEntity.ok(
                collegeService.updateCollege(id, officialName, shortName, aliases, city, state));
    }

    /**
     * POST /users/admin/colleges/{targetId}/merge
     * Body: { "duplicateId": "..." }
     * Merges duplicate into target: updates all students, deletes duplicate.
     */
    @PostMapping("/admin/colleges/{targetId}/merge")
    public ResponseEntity<?> mergeColleges(
            @PathVariable String targetId,
            @RequestBody Map<String, String> body,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        String duplicateId = body.get("duplicateId");
        if (duplicateId == null || duplicateId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "duplicateId is required"));
        }

        long usersUpdated = collegeService.mergeColleges(targetId, duplicateId);
        return ResponseEntity.ok(Map.of(
                "message", "Merge successful",
                "usersUpdated", usersUpdated
        ));
    }

    /**
     * POST /users/admin/colleges/migrate
     * One-time data migration: scans existing user.college strings, creates College records,
     * backfills collegeId on all users. Safe & additive-only.
     */
    @PostMapping("/admin/colleges/migrate")
    public ResponseEntity<?> migrateExistingData(
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(collegeService.migrateExistingData());
    }
}
