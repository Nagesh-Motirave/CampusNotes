package com.campusnoteshub.notes.service;

import com.campusnoteshub.notes.dto.NoteRequestDTO;
import com.campusnoteshub.notes.dto.NoteUploadRequest;
import com.campusnoteshub.notes.dto.StatsResponse;
import com.campusnoteshub.notes.model.Note;
import com.campusnoteshub.notes.model.NoteRequest;
import com.campusnoteshub.notes.model.SearchLog;
import com.campusnoteshub.notes.repository.NoteRepository;
import com.campusnoteshub.notes.repository.NoteRequestRepository;
import com.campusnoteshub.notes.repository.SearchLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class NoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteRequestRepository noteRequestRepository;

    @Autowired
    private SearchLogRepository searchLogRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${user-service.url}")
    private String userServiceUrl;

    public Note uploadNote(NoteUploadRequest request, String userId, String userEmail, String userRole) {
        Note note = new Note();
        note.setTitle(request.getTitle());
        note.setSubject(request.getSubject());
        note.setSemester(request.getSemester());
        note.setYear(request.getYear());
        note.setUnit(request.getUnit());
        note.setCollege(request.getCollege());
        
        note.setUniversity(request.getUniversity());
        note.setBranch(request.getBranch());
        note.setSubjectName(request.getSubjectName());
        note.setResourceType(request.getResourceType());
        note.setFileUrl(request.getFileUrl());
        note.setFileType(request.getFileType());
        note.setExamImportant(request.isExamImportant());
        
        if ("ADMIN".equalsIgnoreCase(userRole)) {
            note.setVerified(true);
        }
        
        note.setUploadedBy(userId);
        note.setUploaderName(userEmail.split("@")[0]); // Simplified name logic for now

        Note savedNote = noteRepository.save(note);
        
        // Note: Points are now awarded upon admin approval, not upload.

        // Auto-fulfill matching requests and notify
        List<NoteRequest> openRequests = noteRequestRepository.findByFulfilledFalseOrderByCreatedAtDesc();
        for (NoteRequest req : openRequests) {
            if (req.getSubject() != null && req.getSubject().equalsIgnoreCase(note.getSubject())) {
                req.setFulfilled(true);
                req.setFulfilledBy(userId);
                req.setNoteId(savedNote.getId());
                noteRequestRepository.save(req);
                sendNotification(req.getRequestedBy(), 
                    "Your requested note for " + note.getSubject() + " is now available!", 
                    "/notes/" + savedNote.getId());
            }
        }

        return savedNote;
    }

    private void sendNotification(String userId, String message, String link) {
        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(userServiceUrl + "/users/internal/" + userId + "/notifications")
                    .queryParam("message", message);
            if (link != null) {
                builder.queryParam("link", link);
            }
            restTemplate.postForEntity(builder.toUriString(), null, Void.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification to user " + userId + ": " + e.getMessage());
        }
    }

    public Page<Note> getNotes(String university, String branch, String year, Integer semester, String subjectName, String resourceType, String subject, String college, String uploaderId, String likedByUserId, int page, int size, String sort) {
        Query query = new Query();

        if (university != null && !university.isEmpty()) query.addCriteria(Criteria.where("university").regex(university, "i"));
        if (branch != null && !branch.isEmpty()) query.addCriteria(Criteria.where("branch").regex(branch, "i"));
        if (year != null && !year.isEmpty()) {
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("year").regex(year, "i"),
                    Criteria.where("branch").regex(year, "i"),
                    Criteria.where("university").regex(year, "i")
            ));
        }
        if (semester != null) query.addCriteria(Criteria.where("semester").is(semester));
        if (subjectName != null && !subjectName.isEmpty()) query.addCriteria(Criteria.where("subjectName").regex(subjectName, "i"));
        if (resourceType != null && !resourceType.isEmpty()) query.addCriteria(Criteria.where("resourceType").regex(resourceType, "i"));
        if (subject != null && !subject.isEmpty()) {
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("subject").regex(subject, "i"),
                    Criteria.where("subjectName").regex(subject, "i")
            ));
        }
        if (college != null && !college.isEmpty()) query.addCriteria(Criteria.where("college").regex(college, "i"));
        if (uploaderId != null && !uploaderId.isEmpty()) query.addCriteria(Criteria.where("uploadedBy").is(uploaderId));
        if (likedByUserId != null && !likedByUserId.isEmpty()) query.addCriteria(Criteria.where("likes").is(likedByUserId));

        // Always exclude archived and unverified notes from public queries
        query.addCriteria(Criteria.where("archived").is(false));
        query.addCriteria(Criteria.where("verified").is(true));

        Sort sortOrder = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("mostDownloaded".equals(sort)) sortOrder = Sort.by(Sort.Direction.DESC, "downloads");
        else if ("topRated".equals(sort)) sortOrder = Sort.by(Sort.Direction.DESC, "likesCount");

        Pageable pageable = PageRequest.of(page, size, sortOrder);
        query.with(pageable);

        long total = mongoTemplate.count(query, Note.class);
        List<Note> notes = mongoTemplate.find(query, Note.class);

        return new PageImpl<>(notes, pageable, total);
    }

    public List<String> getDistinctValues(String field, String university, String branch, String year, Integer semester, String subjectName) {
        Query query = new Query();
        if (university != null && !university.isEmpty()) query.addCriteria(Criteria.where("university").is(university));
        if (branch != null && !branch.isEmpty()) query.addCriteria(Criteria.where("branch").is(branch));
        if (year != null && !year.isEmpty()) query.addCriteria(Criteria.where("year").is(year));
        if (semester != null) query.addCriteria(Criteria.where("semester").is(semester));
        if (subjectName != null && !subjectName.isEmpty()) query.addCriteria(Criteria.where("subjectName").is(subjectName));

        // Always exclude archived and unverified notes
        query.addCriteria(Criteria.where("archived").is(false));
        query.addCriteria(Criteria.where("verified").is(true));

        // Use MongoTemplate to find distinct values for the given field matching the query
        List<Object> rawValues = mongoTemplate.findDistinct(query, field, Note.class, Object.class);
        return rawValues.stream()
                .filter(java.util.Objects::nonNull)
                .map(Object::toString)
                .collect(java.util.stream.Collectors.toList());
    }

    public Note getNoteById(String id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));
    }

    public Note toggleLike(String id, String userId) {
        Note note = getNoteById(id);
        
        if (note.getLikes().contains(userId)) {
            note.getLikes().remove(userId);
            note.setLikesCount(note.getLikesCount() - 1);
        } else {
            note.getLikes().add(userId);
            note.setLikesCount(note.getLikesCount() + 1);
        }
        
        return noteRepository.save(note);
    }

    public Note recordDownload(String id, String userId) {
        Note note = getNoteById(id);
        note.setDownloads(note.getDownloads() + 1);
        
        return noteRepository.save(note);
    }

    public Page<Note> searchNotes(String query, int page, int size, String userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Query mongoQuery = new Query();
        mongoQuery.addCriteria(Criteria.where("archived").is(false));
        
        if (query != null && !query.trim().isEmpty()) {
            String[] keywords = query.trim().split("\\s+");
            List<Criteria> keywordCriterias = new java.util.ArrayList<>();
            
            for (String keyword : keywords) {
                Criteria keywordCriteria = new Criteria().orOperator(
                    Criteria.where("title").regex(keyword, "i"),
                    Criteria.where("subject").regex(keyword, "i"),
                    Criteria.where("subjectName").regex(keyword, "i"),
                    Criteria.where("branch").regex(keyword, "i"),
                    Criteria.where("university").regex(keyword, "i")
                );
                keywordCriterias.add(keywordCriteria);
            }
            mongoQuery.addCriteria(new Criteria().andOperator(keywordCriterias.toArray(new Criteria[0])));
        }
        
        mongoQuery.with(pageable);
        long total = mongoTemplate.count(mongoQuery, Note.class);
        List<Note> notes = mongoTemplate.find(mongoQuery, Note.class);
        Page<Note> results = new PageImpl<>(notes, pageable, total);

        if (query != null && !query.isBlank()) {
            try {
                searchLogRepository.save(new SearchLog(
                        query.trim().toLowerCase(),
                        (int) results.getTotalElements(),
                        userId
                ));
            } catch (Exception e) {
                System.err.println("Failed to log search query: " + e.getMessage());
            }
        }

        return results;
    }

    public List<Note> getTopNotes() {
        return noteRepository.findTop6ByArchivedFalseOrderByDownloadsDesc();
    }

    /**
     * Returns platform-level stats: real note count.
     * College and student counts are now fetched directly by the frontend to avoid inter-service dependencies.
     */
    public StatsResponse getStats() {
        long totalNotes = noteRepository.count();
        return new StatsResponse(totalNotes, 0, 0);
    }

    public Map<String, Object> getUserStats(String userId) {
        // Only count verified (approved) and non-archived notes for stats and points
        Query query = new Query(Criteria.where("uploadedBy").is(userId)
                .and("verified").is(true)
                .and("archived").is(false));
        List<Note> userNotes = mongoTemplate.find(query, Note.class);
        
        long notesUploaded = userNotes.size();
        long totalLikes = userNotes.stream().mapToLong(Note::getLikesCount).sum();
        long totalDownloads = userNotes.stream().mapToLong(Note::getDownloads).sum();
        
        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("notesUploaded", notesUploaded);
        stats.put("totalLikes", totalLikes);
        stats.put("totalDownloads", totalDownloads);
        return stats;
    }

    /**
     * Compute total points for each user based ONLY on approved notes.
     * Total Points = Number of Approved Notes Uploaded by User * 5
     */
    public java.util.Map<String, Integer> getPointsSummary() {
        org.springframework.data.mongodb.core.aggregation.Aggregation agg = org.springframework.data.mongodb.core.aggregation.Aggregation.newAggregation(
                org.springframework.data.mongodb.core.aggregation.Aggregation.match(Criteria.where("verified").is(true).and("archived").is(false)),
                org.springframework.data.mongodb.core.aggregation.Aggregation.group("uploadedBy").count().as("approvedCount")
        );
        org.springframework.data.mongodb.core.aggregation.AggregationResults<java.util.Map> results = mongoTemplate.aggregate(agg, "notes", java.util.Map.class);
        
        java.util.Map<String, Integer> pointsMap = new java.util.HashMap<>();
        for (java.util.Map doc : results.getMappedResults()) {
            String userId = (String) doc.get("_id");
            if (userId == null || userId.isEmpty()) continue;
            
            Number countNum = (Number) doc.get("approvedCount");
            int approvedCount = countNum != null ? countNum.intValue() : 0;
            pointsMap.put(userId, approvedCount * 5);
        }
        return pointsMap;
    }

    public void recalculateAllPoints() {
        // Find all distinct uploaders
        List<String> uploaders = mongoTemplate.findDistinct(new Query(), "uploadedBy", Note.class, String.class);
        for (String userId : uploaders) {
            if (userId == null || userId.isEmpty()) continue;
            recalculateUserPoints(userId);
        }
    }

    public NoteRequest createRequest(NoteRequestDTO dto, String userId, String userEmail) {
        NoteRequest req = new NoteRequest();
        req.setSubject(dto.getSubject());
        req.setSemester(dto.getSemester());
        req.setDescription(dto.getDescription());
        req.setRequestedBy(userId);
        req.setRequesterName(userEmail.split("@")[0]);
        return noteRequestRepository.save(req);
    }

    public List<NoteRequest> getOpenRequests() {
        return noteRequestRepository.findByFulfilledFalseOrderByCreatedAtDesc();
    }

    public NoteRequest fulfillRequest(String id, String userId) {
        NoteRequest req = noteRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        req.setFulfilled(true);
        req.setFulfilledBy(userId);
        
        return noteRequestRepository.save(req);
    }

    public void recalculateUserPoints(String userId) {
        try {
            Map<String, Object> stats = getUserStats(userId);
            long uploaded = (long) stats.get("notesUploaded");
            int totalPoints = (int) (uploaded * 5);

            String url = UriComponentsBuilder.fromHttpUrl(userServiceUrl + "/users/internal/" + userId + "/points/set")
                    .queryParam("points", totalPoints)
                    .toUriString();
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception e) {
            System.err.println("Failed to recalculate points for user " + userId + ": " + e.getMessage());
        }
    }

    public void deleteNoteForUser(String noteId, String userId) {
        Note note = getNoteById(noteId);
        if (!note.getUploadedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this note");
        }
        if (note.isVerified()) {
            throw new RuntimeException("Cannot delete approved resources");
        }
        noteRepository.delete(note);
    }
}
