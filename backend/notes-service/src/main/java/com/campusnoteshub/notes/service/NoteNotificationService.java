package com.campusnoteshub.notes.service;

import com.campusnoteshub.notes.model.Note;
import com.campusnoteshub.notes.model.NoteRequest;
import com.campusnoteshub.notes.repository.NoteRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Orchestrates the "notes available" notification workflow.
 * When a note is uploaded/approved, finds matching unfulfilled requests
 * and sends email notifications via Resend.
 */
@Service
public class NoteNotificationService {

    private static final Logger log = LoggerFactory.getLogger(NoteNotificationService.class);

    private final NoteRequestRepository noteRequestRepository;
    private final ResendEmailService resendEmailService;

    public NoteNotificationService(NoteRequestRepository noteRequestRepository,
                                   ResendEmailService resendEmailService) {
        this.noteRequestRepository = noteRequestRepository;
        this.resendEmailService = resendEmailService;
    }

    /**
     * Asynchronously finds all pending, un-notified note requests matching
     * the given note's subject and sends email notifications.
     *
     * Runs on a separate thread so it doesn't block the upload/approve HTTP response.
     *
     * @param note     the note that was just uploaded or approved
     * @param userId   the ID of the user who uploaded/approved the note
     */
    @Async("notificationExecutor")
    public void notifyMatchingRequests(Note note, String userId) {
        String subject = note.getSubject();
        if (subject == null || subject.isBlank()) {
            log.debug("Note {} has no subject — skipping notification check", note.getId());
            return;
        }

        log.info("Checking for pending note requests matching subject '{}' for note {}", subject, note.getId());

        List<NoteRequest> pendingRequests = noteRequestRepository
                .findBySubjectIgnoreCaseAndFulfilledFalseAndNotifiedFalse(subject);

        if (pendingRequests.isEmpty()) {
            log.info("No pending un-notified requests found for subject '{}'", subject);
            return;
        }

        log.info("Found {} pending request(s) for subject '{}' — sending notifications", 
                pendingRequests.size(), subject);

        for (NoteRequest req : pendingRequests) {
            try {
                boolean emailSent = resendEmailService.sendNoteAvailableEmail(
                        req.getRequesterEmail(),
                        subject,
                        note.getId()
                );

                // Mark request as fulfilled regardless of email success
                req.setFulfilled(true);
                req.setFulfilledBy(userId);
                req.setNoteId(note.getId());

                if (emailSent) {
                    req.setNotified(true);
                    req.setNotifiedAt(LocalDateTime.now());
                    log.info("✅ Notified user {} (email: {}) about note '{}'",
                            req.getRequestedBy(), req.getRequesterEmail(), subject);
                } else {
                    // fulfilled but not notified — can be retried later
                    log.warn("⚠️ Request {} fulfilled but email notification failed for {}",
                            req.getId(), req.getRequesterEmail());
                }

                noteRequestRepository.save(req);

            } catch (Exception e) {
                log.error("❌ Error processing notification for request {}: {}",
                        req.getId(), e.getMessage());
            }
        }
    }
}
