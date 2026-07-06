package com.campusnoteshub.notes.controller;

import com.campusnoteshub.notes.model.Review;
import com.campusnoteshub.notes.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notes")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/{noteId}/reviews")
    public ResponseEntity<List<Review>> getReviews(@PathVariable String noteId) {
        return ResponseEntity.ok(reviewRepository.findByNoteIdOrderByCreatedAtDesc(noteId));
    }

    @PostMapping("/{noteId}/reviews")
    public ResponseEntity<Review> addReview(
            @PathVariable String noteId,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Email") String userEmail,
            @RequestBody Review request) {
        
        Review review = new Review(
            noteId, 
            userId, 
            userEmail.split("@")[0], 
            request.getRating(), 
            request.getComment()
        );
        return ResponseEntity.ok(reviewRepository.save(review));
    }
}
