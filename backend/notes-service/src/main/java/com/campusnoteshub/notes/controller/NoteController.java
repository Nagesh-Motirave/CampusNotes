package com.campusnoteshub.notes.controller;

import com.campusnoteshub.notes.dto.NoteRequestDTO;
import com.campusnoteshub.notes.dto.NoteUploadRequest;
import com.campusnoteshub.notes.dto.StatsResponse;
import com.campusnoteshub.notes.model.Note;
import com.campusnoteshub.notes.model.NoteRequest;
import com.campusnoteshub.notes.service.NoteService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notes")
public class NoteController {

    private static final Logger log =
            LoggerFactory.getLogger(NoteController.class);

    @Autowired
    private NoteService noteService;

    @PostMapping("/upload")
    public ResponseEntity<Note> uploadNote(
            @Valid @RequestBody NoteUploadRequest request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String userEmail,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        return ResponseEntity.ok(
                noteService.uploadNote(
                        request,
                        userId,
                        userEmail,
                        userRole
                )
        );
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

        return ResponseEntity.ok(
                noteService.getNotes(
                        university,
                        branch,
                        year,
                        semester,
                        subjectName,
                        resourceType,
                        subject,
                        college,
                        uploaderId,
                        likedByUserId,
                        page,
                        size,
                        sort
                )
        );
    }

    @GetMapping("/distinct")
    public ResponseEntity<List<String>> getDistinctValues(
            @RequestParam String field,
            @RequestParam(required = false) String university,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String subjectName) {

        return ResponseEntity.ok(
                noteService.getDistinctValues(
                        field,
                        university,
                        branch,
                        year,
                        semester,
                        subjectName
                )
        );
    }

    /**
     * Get a single note by MongoDB ID.
     *
     * Returns:
     * 200 - note found
     * 400 - empty ID
     * 404 - note does not exist
     * 500 - unexpected backend error
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getNoteById(@PathVariable String id) {

        log.info(
                "[NoteController] GET /notes/{} - request received",
                id
        );

        if (id == null || id.trim().isEmpty()) {
            log.warn("[NoteController] Empty note ID received");

            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Note ID is required"
                    ));
        }

        String noteId = id.trim();

        try {

            Note note = noteService.getNoteById(noteId);

            log.info(
                    "[NoteController] Note found successfully: id={}, title={}",
                    note.getId(),
                    note.getTitle()
            );

            return ResponseEntity.ok(note);

        } catch (IllegalArgumentException e) {

            log.warn(
                    "[NoteController] Invalid note ID: {}",
                    noteId,
                    e
            );

            return ResponseEntity.status(404)
                    .body(Map.of(
                            "error", "Note not found",
                            "id", noteId
                    ));

        } catch (RuntimeException e) {

            log.warn(
                    "[NoteController] Note not found: id={}, message={}",
                    noteId,
                    e.getMessage()
            );

            return ResponseEntity.status(404)
                    .body(Map.of(
                            "error", "Note not found",
                            "id", noteId
                    ));

        } catch (Exception e) {

            log.error(
                    "[NoteController] Unexpected error while fetching note: {}",
                    noteId,
                    e
            );

            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "error", "Failed to fetch note",
                            "id", noteId
                    ));
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Note> toggleLike(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        return ResponseEntity.ok(
                noteService.toggleLike(id, userId)
        );
    }

    @PostMapping("/{id}/download")
    public ResponseEntity<Note> recordDownload(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        return ResponseEntity.ok(
                noteService.recordDownload(id, userId)
        );
    }

    @GetMapping("/search")
    public ResponseEntity<Page<Note>> searchNotes(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        return ResponseEntity.ok(
                noteService.searchNotes(
                        q,
                        page,
                        size,
                        userId
                )
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsResponse> getStats() {
        return ResponseEntity.ok(noteService.getStats());
    }

    @GetMapping("/users/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(
            @PathVariable String userId) {

        log.info(
                "[NoteController] GET /notes/users/{}/stats - request received",
                userId
        );

        Map<String, Object> stats =
                noteService.getUserStats(userId);

        log.info(
                "[NoteController] GET /notes/users/{}/stats - returning response: {}",
                userId,
                stats
        );

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/internal/points-summary")
    public ResponseEntity<Map<String, Integer>> getPointsSummary() {
        return ResponseEntity.ok(
                noteService.getPointsSummary()
        );
    }

    @GetMapping("/top")
    public ResponseEntity<List<Note>> getTopNotes() {
        return ResponseEntity.ok(
                noteService.getTopNotes()
        );
    }

    @PostMapping("/requests")
    public ResponseEntity<NoteRequest> createRequest(
            @Valid @RequestBody NoteRequestDTO request,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String userEmail) {

        return ResponseEntity.ok(
                noteService.createRequest(
                        request,
                        userId,
                        userEmail
                )
        );
    }

    @GetMapping("/requests")
    public ResponseEntity<List<NoteRequest>> getOpenRequests() {
        return ResponseEntity.ok(
                noteService.getOpenRequests()
        );
    }

    @PutMapping("/requests/{id}/fulfill")
    public ResponseEntity<NoteRequest> fulfillRequest(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        return ResponseEntity.ok(
                noteService.fulfillRequest(
                        id,
                        userId
                )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        noteService.deleteNoteForUser(
                id,
                userId
        );

        return ResponseEntity.ok().build();
    }
}