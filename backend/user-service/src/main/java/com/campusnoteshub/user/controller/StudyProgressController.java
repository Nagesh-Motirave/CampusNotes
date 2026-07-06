package com.campusnoteshub.user.controller;

import com.campusnoteshub.user.model.StudyProgress;
import com.campusnoteshub.user.repository.StudyProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class StudyProgressController {

    @Autowired
    private StudyProgressRepository studyProgressRepository;

    @GetMapping("/{userId}/progress")
    public ResponseEntity<List<StudyProgress>> getProgress(@PathVariable String userId) {
        return ResponseEntity.ok(studyProgressRepository.findByUserId(userId));
    }

    @PostMapping("/{userId}/progress/{noteId}")
    public ResponseEntity<StudyProgress> toggleProgress(@PathVariable String userId, @PathVariable String noteId) {
        Optional<StudyProgress> existing = studyProgressRepository.findByUserIdAndNoteId(userId, noteId);
        if (existing.isPresent()) {
            StudyProgress progress = existing.get();
            progress.setCompleted(!progress.isCompleted());
            return ResponseEntity.ok(studyProgressRepository.save(progress));
        } else {
            StudyProgress progress = new StudyProgress(userId, noteId, true);
            return ResponseEntity.ok(studyProgressRepository.save(progress));
        }
    }
}
