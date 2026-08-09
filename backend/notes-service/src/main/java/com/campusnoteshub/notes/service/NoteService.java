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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import org.springframework.stereotype.Service;

import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class NoteService {

    private static final Logger log =
            LoggerFactory.getLogger(NoteService.class);

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

    @Autowired
    private NoteNotificationService noteNotificationService;

    @Value("${user-service.url}")
    private String userServiceUrl;


    // =========================================================
    // UPLOAD NOTE
    // =========================================================

    public Note uploadNote(
            NoteUploadRequest request,
            String userId,
            String userEmail,
            String userRole) {

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

        if (userEmail != null && userEmail.contains("@")) {
            note.setUploaderName(
                    userEmail.substring(0, userEmail.indexOf("@"))
            );
        } else {
            note.setUploaderName(userEmail);
        }

        Note savedNote = noteRepository.save(note);

        /*
         * Auto-fulfill matching requests and send in-app
         * notifications.
         */
        List<NoteRequest> matchingRequests =
                noteRequestRepository
                        .findBySubjectIgnoreCaseAndFulfilledFalse(
                                note.getSubject()
                        );

        for (NoteRequest req : matchingRequests) {

            req.setFulfilled(true);
            req.setFulfilledBy(userId);
            req.setNoteId(savedNote.getId());

            noteRequestRepository.save(req);

            sendNotification(
                    req.getRequestedBy(),
                    "Your requested note for "
                            + note.getSubject()
                            + " is now available!",
                    "/notes/" + savedNote.getId()
            );
        }

        /*
         * Send email notifications asynchronously for matching
         * requests.
         */
        try {
            noteNotificationService.notifyMatchingRequests(
                    savedNote,
                    userId
            );
        } catch (Exception e) {
            log.error(
                    "Failed to send note availability notifications",
                    e
            );
        }

        return savedNote;
    }


    // =========================================================
    // INTERNAL NOTIFICATION
    // =========================================================

    private void sendNotification(
            String userId,
            String message,
            String link) {

        try {

            UriComponentsBuilder builder =
                    UriComponentsBuilder
                            .fromHttpUrl(
                                    userServiceUrl
                                            + "/users/internal/"
                                            + userId
                                            + "/notifications"
                            )
                            .queryParam("message", message);

            if (link != null) {
                builder.queryParam("link", link);
            }

            restTemplate.postForEntity(
                    builder.toUriString(),
                    null,
                    Void.class
            );

        } catch (Exception e) {

            log.error(
                    "Failed to send notification to user {}",
                    userId,
                    e
            );
        }
    }


    // =========================================================
    // GET NOTES
    // =========================================================

    public Page<Note> getNotes(
            String university,
            String branch,
            String year,
            Integer semester,
            String subjectName,
            String resourceType,
            String subject,
            String college,
            String uploaderId,
            String likedByUserId,
            int page,
            int size,
            String sort) {

        Query query = new Query();

        if (university != null && !university.isEmpty()) {
            query.addCriteria(
                    Criteria.where("university")
                            .regex(university, "i")
            );
        }

        if (branch != null && !branch.isEmpty()) {
            query.addCriteria(
                    Criteria.where("branch")
                            .regex(branch, "i")
            );
        }

        if (year != null && !year.isEmpty()) {

            query.addCriteria(
                    new Criteria().orOperator(
                            Criteria.where("year")
                                    .regex(year, "i"),

                            Criteria.where("branch")
                                    .regex(year, "i"),

                            Criteria.where("university")
                                    .regex(year, "i")
                    )
            );
        }

        if (semester != null) {
            query.addCriteria(
                    Criteria.where("semester").is(semester)
            );
        }

        if (subjectName != null && !subjectName.isEmpty()) {
            query.addCriteria(
                    Criteria.where("subjectName")
                            .regex(subjectName, "i")
            );
        }

        if (resourceType != null && !resourceType.isEmpty()) {
            query.addCriteria(
                    Criteria.where("resourceType")
                            .regex(resourceType, "i")
            );
        }

        if (subject != null && !subject.isEmpty()) {

            query.addCriteria(
                    new Criteria().orOperator(
                            Criteria.where("subject")
                                    .regex(subject, "i"),

                            Criteria.where("subjectName")
                                    .regex(subject, "i")
                    )
            );
        }

        if (college != null && !college.isEmpty()) {
            query.addCriteria(
                    Criteria.where("college")
                            .regex(college, "i")
            );
        }

        if (uploaderId != null && !uploaderId.isEmpty()) {
            query.addCriteria(
                    Criteria.where("uploadedBy")
                            .is(uploaderId)
            );
        }

        if (likedByUserId != null && !likedByUserId.isEmpty()) {
            query.addCriteria(
                    Criteria.where("likes")
                            .is(likedByUserId)
            );
        }

        // Public notes must be approved and not archived.
        query.addCriteria(
                Criteria.where("archived").is(false)
        );

        query.addCriteria(
                Criteria.where("verified").is(true)
        );

        Sort sortOrder =
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                );

        if ("mostDownloaded".equals(sort)) {

            sortOrder =
                    Sort.by(
                            Sort.Direction.DESC,
                            "downloads"
                    );

        } else if ("topRated".equals(sort)) {

            sortOrder =
                    Sort.by(
                            Sort.Direction.DESC,
                            "likesCount"
                    );
        }

        long total =
                mongoTemplate.count(
                        Query.of(query)
                                .limit(-1)
                                .skip(-1),
                        Note.class
                );

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        sortOrder
                );

        query.with(pageable);

        List<Note> notes =
                mongoTemplate.find(
                        query,
                        Note.class
                );

        return new PageImpl<>(
                notes,
                pageable,
                total
        );
    }


    // =========================================================
    // DISTINCT VALUES
    // =========================================================

    public List<String> getDistinctValues(
            String field,
            String university,
            String branch,
            String year,
            Integer semester,
            String subjectName) {

        Query query = new Query();

        if (university != null && !university.isEmpty()) {
            query.addCriteria(
                    Criteria.where("university")
                            .is(university)
            );
        }

        if (branch != null && !branch.isEmpty()) {
            query.addCriteria(
                    Criteria.where("branch")
                            .is(branch)
            );
        }

        if (year != null && !year.isEmpty()) {
            query.addCriteria(
                    Criteria.where("year")
                            .is(year)
            );
        }

        if (semester != null) {
            query.addCriteria(
                    Criteria.where("semester")
                            .is(semester)
            );
        }

        if (subjectName != null && !subjectName.isEmpty()) {
            query.addCriteria(
                    Criteria.where("subjectName")
                            .is(subjectName)
            );
        }

        query.addCriteria(
                Criteria.where("archived").is(false)
        );

        query.addCriteria(
                Criteria.where("verified").is(true)
        );

        List<Object> rawValues =
                mongoTemplate.findDistinct(
                        query,
                        field,
                        Note.class,
                        Object.class
                );

        return rawValues.stream()
                .filter(java.util.Objects::nonNull)
                .map(Object::toString)
                .collect(
                        java.util.stream.Collectors.toList()
                );
    }


    // =========================================================
    // GET SINGLE NOTE
    // =========================================================

    public Note getNoteById(String id) {

        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException(
                    "Note ID cannot be empty"
            );
        }

        String noteId = id.trim();

        log.info(
                "[getNoteById] Looking for note with id={}",
                noteId
        );

        try {

            /*
             * First use repository lookup.
             */
            Optional<Note> optionalNote =
                    noteRepository.findById(noteId);

            if (optionalNote.isPresent()) {

                Note note = optionalNote.get();

                log.info(
                        "[getNoteById] Note found using repository: id={}, title={}",
                        note.getId(),
                        note.getTitle()
                );

                return note;
            }

            /*
             * Fallback direct Mongo query.
             *
             * This helps if there is a repository mapping issue
             * but the Mongo document actually exists.
             */
            log.info(
                    "[getNoteById] Repository did not find note. Trying MongoTemplate. id={}",
                    noteId
            );

            Query query =
                    new Query(
                            Criteria.where("_id").is(noteId)
                    );

            Note mongoNote =
                    mongoTemplate.findOne(
                            query,
                            Note.class
                    );

            if (mongoNote != null) {

                log.info(
                        "[getNoteById] Note found using MongoTemplate: id={}, title={}",
                        mongoNote.getId(),
                        mongoNote.getTitle()
                );

                return mongoNote;
            }

            /*
             * Final fallback using ObjectId.
             *
             * This is useful when the Mongo ID is stored as
             * BSON ObjectId rather than String.
             */
            if (org.bson.types.ObjectId.isValid(noteId)) {

                try {

                    org.bson.types.ObjectId objectId =
                            new org.bson.types.ObjectId(noteId);

                    Query objectIdQuery =
                            new Query(
                                    Criteria.where("_id")
                                            .is(objectId)
                            );

                    Note objectIdNote =
                            mongoTemplate.findOne(
                                    objectIdQuery,
                                    Note.class
                            );

                    if (objectIdNote != null) {

                        log.info(
                                "[getNoteById] Note found using ObjectId: id={}, title={}",
                                objectIdNote.getId(),
                                objectIdNote.getTitle()
                        );

                        return objectIdNote;
                    }

                } catch (Exception objectIdException) {

                    log.warn(
                            "[getNoteById] ObjectId lookup failed for id={}",
                            noteId,
                            objectIdException
                    );
                }
            }

            log.warn(
                    "[getNoteById] Note not found anywhere. id={}",
                    noteId
            );

            throw new RuntimeException(
                    "Note not found with id: " + noteId
            );

        } catch (IllegalArgumentException e) {

            log.error(
                    "[getNoteById] Invalid note ID: {}",
                    noteId,
                    e
            );

            throw e;

        } catch (RuntimeException e) {

            throw e;

        } catch (Exception e) {

            log.error(
                    "[getNoteById] Error fetching note with id={}",
                    noteId,
                    e
            );

            throw new RuntimeException(
                    "Failed to fetch note: " + noteId,
                    e
            );
        }
    }


    // =========================================================
    // LIKE
    // =========================================================

    public Note toggleLike(
            String id,
            String userId) {

        Note note = getNoteById(id);

        if (note.getLikes().contains(userId)) {

            note.getLikes().remove(userId);

            note.setLikesCount(
                    note.getLikesCount() - 1
            );

        } else {

            note.getLikes().add(userId);

            note.setLikesCount(
                    note.getLikesCount() + 1
            );
        }

        return noteRepository.save(note);
    }


    // =========================================================
    // DOWNLOAD
    // =========================================================

    public Note recordDownload(
            String id,
            String userId) {

        Note note = getNoteById(id);

        note.setDownloads(
                note.getDownloads() + 1
        );

        return noteRepository.save(note);
    }


    // =========================================================
    // SEARCH
    // =========================================================

    public Page<Note> searchNotes(
            String query,
            int page,
            int size,
            String userId) {

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                Sort.Direction.DESC,
                                "createdAt"
                        )
                );

        Query mongoQuery = new Query();

        mongoQuery.addCriteria(
                Criteria.where("archived").is(false)
        );

        mongoQuery.addCriteria(
                Criteria.where("verified").is(true)
        );

        if (query != null && !query.trim().isEmpty()) {

            String[] keywords =
                    query.trim().split("\\s+");

            List<Criteria> keywordCriterias =
                    new java.util.ArrayList<>();

            for (String keyword : keywords) {

                Criteria keywordCriteria =
                        new Criteria().orOperator(

                                Criteria.where("title")
                                        .regex(keyword, "i"),

                                Criteria.where("subject")
                                        .regex(keyword, "i"),

                                Criteria.where("subjectName")
                                        .regex(keyword, "i"),

                                Criteria.where("branch")
                                        .regex(keyword, "i"),

                                Criteria.where("university")
                                        .regex(keyword, "i")
                        );

                keywordCriterias.add(
                        keywordCriteria
                );
            }

            mongoQuery.addCriteria(
                    new Criteria().andOperator(
                            keywordCriterias.toArray(
                                    new Criteria[0]
                            )
                    )
            );
        }

        long total =
                mongoTemplate.count(
                        Query.of(mongoQuery)
                                .limit(-1)
                                .skip(-1),
                        Note.class
                );

        mongoQuery.with(pageable);

        List<Note> notes =
                mongoTemplate.find(
                        mongoQuery,
                        Note.class
                );

        Page<Note> results =
                new PageImpl<>(
                        notes,
                        pageable,
                        total
                );

        if (query != null && !query.isBlank()) {

            try {

                searchLogRepository.save(
                        new SearchLog(
                                query.trim().toLowerCase(),
                                (int) results.getTotalElements(),
                                userId
                        )
                );

            } catch (Exception e) {

                log.error(
                        "Failed to log search query",
                        e
                );
            }
        }

        return results;
    }


    // =========================================================
    // TOP NOTES
    // =========================================================

    public List<Note> getTopNotes() {
        return noteRepository
                .findTop6ByArchivedFalseOrderByDownloadsDesc();
    }


    // =========================================================
    // PLATFORM STATS
    // =========================================================

    public StatsResponse getStats() {

        long totalNotes =
                noteRepository.count();

        return new StatsResponse(
                totalNotes,
                0,
                0
        );
    }


    // =========================================================
    // USER STATS
    // =========================================================

    public Map<String, Object> getUserStats(
            String userId) {

        log.info(
                "[getUserStats] Request received for userId={}",
                userId
        );

        try {

            Aggregation aggregation =
                    Aggregation.newAggregation(

                            Aggregation.match(
                                    Criteria.where("uploadedBy")
                                            .is(userId)
                                            .and("verified")
                                            .is(true)
                                            .and("archived")
                                            .is(false)
                            ),

                            Aggregation.group()
                                    .count()
                                    .as("notesUploaded")
                                    .sum("likesCount")
                                    .as("totalLikes")
                                    .sum("downloads")
                                    .as("totalDownloads")
                    );

            AggregationResults<Map> results =
                    mongoTemplate.aggregate(
                            aggregation,
                            "notes",
                            Map.class
                    );

            Map<String, Object> stats =
                    new java.util.HashMap<>();

            if (results.getUniqueMappedResult() != null) {

                Map rawResult =
                        results.getUniqueMappedResult();

                long notesUploaded =
                        rawResult.get("notesUploaded") != null
                                ? ((Number) rawResult
                                        .get("notesUploaded"))
                                        .longValue()
                                : 0L;

                long totalLikes =
                        rawResult.get("totalLikes") != null
                                ? ((Number) rawResult
                                        .get("totalLikes"))
                                        .longValue()
                                : 0L;

                long totalDownloads =
                        rawResult.get("totalDownloads") != null
                                ? ((Number) rawResult
                                        .get("totalDownloads"))
                                        .longValue()
                                : 0L;

                stats.put(
                        "notesUploaded",
                        notesUploaded
                );

                stats.put(
                        "totalLikes",
                        totalLikes
                );

                stats.put(
                        "totalDownloads",
                        totalDownloads
                );

            } else {

                stats.put(
                        "notesUploaded",
                        0
                );

                stats.put(
                        "totalLikes",
                        0
                );

                stats.put(
                        "totalDownloads",
                        0
                );
            }

            return stats;

        } catch (Exception e) {

            log.error(
                    "[getUserStats] Exception while computing stats for userId={}",
                    userId,
                    e
            );

            Map<String, Object> defaultStats =
                    new java.util.HashMap<>();

            defaultStats.put(
                    "notesUploaded",
                    0
            );

            defaultStats.put(
                    "totalLikes",
                    0
            );

            defaultStats.put(
                    "totalDownloads",
                    0
            );

            return defaultStats;
        }
    }


    // =========================================================
    // POINTS
    // =========================================================

    public Map<String, Integer> getPointsSummary() {

        Aggregation agg =
                Aggregation.newAggregation(

                        Aggregation.match(
                                Criteria.where("verified")
                                        .is(true)
                                        .and("archived")
                                        .is(false)
                        ),

                        Aggregation.group("uploadedBy")
                                .count()
                                .as("approvedCount")
                );

        AggregationResults<Map> results =
                mongoTemplate.aggregate(
                        agg,
                        "notes",
                        Map.class
                );

        Map<String, Integer> pointsMap =
                new java.util.HashMap<>();

        for (Map doc : results.getMappedResults()) {

            String userId =
                    (String) doc.get("_id");

            if (userId == null || userId.isEmpty()) {
                continue;
            }

            Number countNum =
                    (Number) doc.get("approvedCount");

            int approvedCount =
                    countNum != null
                            ? countNum.intValue()
                            : 0;

            pointsMap.put(
                    userId,
                    approvedCount * 5
            );
        }

        return pointsMap;
    }


    // =========================================================
    // CREATE NOTE REQUEST
    // =========================================================

    public NoteRequest createRequest(
            NoteRequestDTO dto,
            String userId,
            String userEmail) {

        NoteRequest req =
                new NoteRequest();

        req.setSubject(
                dto.getSubject()
        );

        req.setSemester(
                dto.getSemester()
        );

        req.setDescription(
                dto.getDescription()
        );

        req.setRequestedBy(
                userId
        );

        if (userEmail != null &&
                userEmail.contains("@")) {

            req.setRequesterName(
                    userEmail.substring(
                            0,
                            userEmail.indexOf("@")
                    )
            );

        } else {

            req.setRequesterName(
                    userEmail
            );
        }

        /*
         * Store requester email so the notification
         * service can send "Notes are available"
         * emails later.
         */
        req.setRequesterEmail(
                userEmail
        );

        return noteRequestRepository.save(req);
    }


    // =========================================================
    // OPEN REQUESTS
    // =========================================================

    public List<NoteRequest> getOpenRequests() {

        return noteRequestRepository
                .findByFulfilledFalseOrderByCreatedAtDesc();
    }


    // =========================================================
    // FULFILL REQUEST
    // =========================================================

    public NoteRequest fulfillRequest(
            String id,
            String userId) {

        NoteRequest req =
                noteRequestRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Request not found"
                                )
                        );

        req.setFulfilled(true);
        req.setFulfilledBy(userId);

        return noteRequestRepository.save(req);
    }


    // =========================================================
    // DELETE NOTE
    // =========================================================

    public void deleteNoteForUser(
            String noteId,
            String userId) {

        Note note =
                getNoteById(noteId);

        if (!note.getUploadedBy()
                .equals(userId)) {

            throw new RuntimeException(
                    "Unauthorized to delete this note"
            );
        }

        if (note.isVerified()) {

            throw new RuntimeException(
                    "Cannot delete approved resources"
            );
        }

        noteRepository.delete(note);
    }
}