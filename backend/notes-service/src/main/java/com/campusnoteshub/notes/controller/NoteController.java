package com.campusnoteshub.notes.controller;

import com.campusnoteshub.notes.dto.NoteRequestDTO;
import com.campusnoteshub.notes.dto.NoteUploadRequest;
import com.campusnoteshub.notes.dto.StatsResponse;
import com.campusnoteshub.notes.model.Note;
import com.campusnoteshub.notes.model.NoteRequest;
import com.campusnoteshub.notes.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notes")
public class NoteController {

    @Autowired
    private NoteService noteService;

    @PostMapping("/upload")
    public ResponseEntity<Note> uploadNote(@Valid @RequestBody NoteUploadRequest request,
                                           @RequestHeader("X-User-Id") String userId,
                                           @RequestHeader("X-User-Email") String userEmail,
                                           @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {
        return ResponseEntity.ok(noteService.uploadNote(request, userId, userEmail, userRole));
    }

    @GetMapping
    public ResponseEntity<Page<Note>> getNotes(
            @RequestParam(required = false) String university,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String subjectName,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String college,
            @RequestParam(required = false) String uploaderId,
            @RequestParam(required = false) String likedByUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "latest") String sort) {
        return ResponseEntity.ok(noteService.getNotes(university, branch, year, semester, subjectName, resourceType, subject, college, uploaderId, likedByUserId, page, size, sort));
    }

    @GetMapping("/distinct")
    public ResponseEntity<List<String>> getDistinctValues(
            @RequestParam String field,
            @RequestParam(required = false) String university,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String subjectName) {
        return ResponseEntity.ok(noteService.getDistinctValues(field, university, branch, year, semester, subjectName));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable String id) {
        return ResponseEntity.ok(noteService.getNoteById(id));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Note> toggleLike(@PathVariable String id, @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(noteService.toggleLike(id, userId));
    }

    @PostMapping("/{id}/download")
    public ResponseEntity<Note> recordDownload(@PathVariable String id, @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(noteService.recordDownload(id, userId));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Note>> searchNotes(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(noteService.searchNotes(q, page, size, userId));
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(noteService.getStats());
    }

    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<java.util.Map<String, Object>> getUserStats(@PathVariable String userId) {
        org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NoteController.class);
        log.info("[NoteController] GET /notes/users/{}/stats — request received", userId);
        java.util.Map<String, Object> stats = noteService.getUserStats(userId);
        log.info("[NoteController] GET /notes/users/{}/stats — returning response: {}", userId, stats);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/internal/points-summary")
    public ResponseEntity<java.util.Map<String, Integer>> getPointsSummary() {
        return ResponseEntity.ok(noteService.getPointsSummary());
    }

    @GetMapping("/top")
    public ResponseEntity<List<Note>> getTopNotes() {
        return ResponseEntity.ok(noteService.getTopNotes());
    }

    @PostMapping("/requests")
    public ResponseEntity<NoteRequest> createRequest(@Valid @RequestBody NoteRequestDTO request,
                                                     @RequestHeader("X-User-Id") String userId,
                                                     @RequestHeader("X-User-Email") String userEmail) {
        return ResponseEntity.ok(noteService.createRequest(request, userId, userEmail));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<NoteRequest>> getOpenRequests() {
        return ResponseEntity.ok(noteService.getOpenRequests());
    }

    @PutMapping("/requests/{id}/fulfill")
    public ResponseEntity<NoteRequest> fulfillRequest(@PathVariable String id, @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(noteService.fulfillRequest(id, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable String id, @RequestHeader("X-User-Id") String userId) {
        noteService.deleteNoteForUser(id, userId);
        return ResponseEntity.ok().build();
    }
}
