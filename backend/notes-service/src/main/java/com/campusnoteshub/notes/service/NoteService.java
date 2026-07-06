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
        
        // Award 10 points for upload via user-service
        awardPoints(userId, 10, "Uploaded note: " + note.getTitle());

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
            String url = userServiceUrl + "/users/internal/" + userId + "/notifications?message=" + message + (link != null ? "&link=" + link : "");
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification to user " + userId + ": " + e.getMessage());
        }
    }

    public Page<Note> getNotes(String university, String branch, String year, Integer semester, String subjectName, String resourceType, String subject, String college, String uploaderId, String likedByUserId, int page, int size, String sort) {
        Query query = new Query();

        if (university != null && !university.isEmpty()) query.addCriteria(Criteria.where("university").is(university));
        if (branch != null && !branch.isEmpty()) query.addCriteria(Criteria.where("branch").is(branch));
        if (year != null && !year.isEmpty()) query.addCriteria(Criteria.where("year").is(year));
        if (semester != null) query.addCriteria(Criteria.where("semester").is(semester));
        if (subjectName != null && !subjectName.isEmpty()) query.addCriteria(Criteria.where("subjectName").is(subjectName));
        if (resourceType != null && !resourceType.isEmpty()) query.addCriteria(Criteria.where("resourceType").is(resourceType));
        if (subject != null && !subject.isEmpty()) query.addCriteria(Criteria.where("subject").is(subject));
        if (college != null && !college.isEmpty()) query.addCriteria(Criteria.where("college").is(college));
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
            
            // Award points to uploader if it reaches milestones (e.g. 5 likes)
            if (note.getLikesCount() % 5 == 0) {
                awardPoints(note.getUploadedBy(), 3, "Your note '" + note.getTitle() + "' reached " + note.getLikesCount() + " likes!");
            }
        }
        
        return noteRepository.save(note);
    }

    public Note recordDownload(String id, String userId) {
        Note note = getNoteById(id);
        note.setDownloads(note.getDownloads() + 1);
        
        // Award points to uploader if it reaches milestones (e.g. 10 downloads)
        if (note.getDownloads() % 10 == 0) {
            awardPoints(note.getUploadedBy(), 5, "Your note '" + note.getTitle() + "' reached " + note.getDownloads() + " downloads!");
        }
        
        return noteRepository.save(note);
    }

    public Page<Note> searchNotes(String query, int page, int size, String userId) {
        Page<Note> results = noteRepository.searchByTitleOrSubject(
                query, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

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
     * Returns platform-level stats: real note count, distinct college count,
     * and total registered students fetched from user-service.
     */
    public StatsResponse getStats() {
        long totalNotes = noteRepository.count();

        long distinctColleges = noteRepository.findAllCollegeFields()
                .stream()
                .map(Note::getCollege)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .count();

        long totalStudents = 0;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(
                    userServiceUrl + "/users/count", Map.class);
            if (resp != null && resp.containsKey("count")) {
                totalStudents = ((Number) resp.get("count")).longValue();
            }
        } catch (Exception e) {
            System.err.println("Could not fetch user count from user-service: " + e.getMessage());
        }

        return new StatsResponse(totalNotes, distinctColleges, totalStudents);
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
        
        // Award points for fulfilling request
        awardPoints(userId, 8, "Fulfilled note request for: " + req.getSubject());
        
        return noteRequestRepository.save(req);
    }

    private void awardPoints(String userId, int points, String description) {
        try {
            // Internal call to user-service
            String url = userServiceUrl + "/users/internal/" + userId + "/points?points=" + points + "&desc=" + description;
            restTemplate.postForEntity(url, null, Void.class);
        } catch (Exception e) {
            System.err.println("Failed to award points to user " + userId + ": " + e.getMessage());
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
