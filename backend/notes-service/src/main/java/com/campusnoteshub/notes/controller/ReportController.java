package com.campusnoteshub.notes.controller;

import com.campusnoteshub.notes.model.Report;
import com.campusnoteshub.notes.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notes")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @PostMapping("/{noteId}/report")
    public ResponseEntity<Report> reportNote(
            @PathVariable String noteId,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Report request) {
        
        Report report = new Report(noteId, userId, request.getReason());
        return ResponseEntity.ok(reportRepository.save(report));
    }
}
