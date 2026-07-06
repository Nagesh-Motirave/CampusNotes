package com.campusnoteshub.notes.controller;

import com.campusnoteshub.notes.model.Note;
import com.campusnoteshub.notes.service.AdminNoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin-only analytics controller for notes data.
 * All endpoints are protected by the gateway (X-User-Role = ADMIN required).
 * Belt-and-suspenders: also checks X-User-Role header here.
 */
@RestController
@RequestMapping("/notes/admin")
public class AdminNoteController {

    @Autowired
    private AdminNoteService adminNoteService;

    /** Double-checks that the caller is an admin (gateway already enforces this). */
    private boolean isAdmin(String role) {
        return "ADMIN".equalsIgnoreCase(role);
    }

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getOverviewStats());
    }

    @GetMapping("/upload-download-stats")
    public ResponseEntity<?> getUploadDownloadStats(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getUploadDownloadStats());
    }

    @GetMapping("/top-downloaded")
    public ResponseEntity<?> getTopDownloaded(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getTopDownloaded());
    }

    @GetMapping("/trending-subjects")
    public ResponseEntity<?> getTrendingSubjects(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getTrendingSubjects());
    }

    @GetMapping("/pending-approval")
    public ResponseEntity<?> getPendingApproval(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getPendingApproval());
    }

    @PostMapping("/approve/{id}")
    public ResponseEntity<?> approveNote(@PathVariable String id,
                                         @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.approveNote(id));
    }

    @GetMapping("/note-requests")
    public ResponseEntity<?> getNoteRequestStats(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getNoteRequestStats());
    }

    @GetMapping("/university-stats")
    public ResponseEntity<?> getUniversityStats(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getUniversityStats());
    }

    @GetMapping("/search-analytics")
    public ResponseEntity<?> getSearchAnalytics(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getSearchAnalytics());
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<?> getRecentActivities(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getRecentActivities());
    }

    @GetMapping("/archived")
    public ResponseEntity<?> getArchivedNotes(@RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.getArchivedNotes());
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archiveNote(@PathVariable String id, @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.archiveNote(id));
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<?> restoreNote(@PathVariable String id, @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminNoteService.restoreNote(id));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> permanentlyDeleteNote(@PathVariable String id, @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role) {
        if (!isAdmin(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        adminNoteService.permanentlyDeleteNote(id);
        return ResponseEntity.ok().build();
    }
}
