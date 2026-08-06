package com.campusnoteshub.notes.service;

import com.campusnoteshub.notes.model.Note;
import com.campusnoteshub.notes.model.NoteRequest;
import com.campusnoteshub.notes.model.SearchLog;
import com.campusnoteshub.notes.repository.NoteRepository;
import com.campusnoteshub.notes.repository.NoteRequestRepository;
import com.campusnoteshub.notes.repository.SearchLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for admin analytics aggregation pipelines.
 * Uses MongoTemplate for complex aggregations that go beyond Spring Data queries.
 */
@Service
public class AdminNoteService {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private NoteRequestRepository noteRequestRepository;

    @Autowired
    private SearchLogRepository searchLogRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NoteService noteService;

    /**
     * Overview stats: total uploads, total downloads, pending approvals, open requests.
     */
    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        long totalUploads = noteRepository.count();
        stats.put("totalUploads", totalUploads);

        // Sum all downloads across notes
        Aggregation downloadAgg = Aggregation.newAggregation(
                Aggregation.group().sum("downloads").as("totalDownloads")
        );
        AggregationResults<Map> downloadResult = mongoTemplate.aggregate(downloadAgg, "notes", Map.class);
        long totalDownloads = 0;
        if (downloadResult.getMappedResults().size() > 0) {
            Object val = downloadResult.getMappedResults().get(0).get("totalDownloads");
            if (val instanceof Number) totalDownloads = ((Number) val).longValue();
        }
        stats.put("totalDownloads", totalDownloads);

        long pendingApproval = mongoTemplate.count(
                Query.query(Criteria.where("verified").is(false)), Note.class);
        stats.put("pendingApproval", pendingApproval);

        long openRequests = noteRequestRepository.countByFulfilledFalse();
        stats.put("openRequests", openRequests);

        long totalRequests = noteRequestRepository.count();
        stats.put("totalRequests", totalRequests);

        return stats;
    }

    /**
     * Upload and download trends over the last 30 days (daily granularity).
     */
    public Map<String, Object> getUploadDownloadStats() {
        Map<String, Object> result = new LinkedHashMap<>();

        LocalDateTime thirtyDaysAgo = LocalDate.now().minusDays(30).atStartOfDay();

        // Daily upload counts over last 30 days
        Aggregation uploadAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(thirtyDaysAgo)),
                Aggregation.project()
                        .andExpression("dateToString('%Y-%m-%d', createdAt)").as("date"),
                Aggregation.group("date").count().as("count"),
                Aggregation.sort(Sort.Direction.ASC, "_id")
        );
        AggregationResults<Map> uploadResults = mongoTemplate.aggregate(uploadAgg, "notes", Map.class);

        List<Map<String, Object>> dailyUploads = new ArrayList<>();
        for (Map doc : uploadResults.getMappedResults()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", doc.get("_id"));
            entry.put("count", doc.get("count"));
            dailyUploads.add(entry);
        }
        result.put("dailyUploads", dailyUploads);

        // Total uploads this week vs last week
        LocalDateTime startOfWeek = LocalDate.now().atStartOfDay().minusDays(LocalDate.now().getDayOfWeek().getValue() - 1);
        LocalDateTime startOfLastWeek = startOfWeek.minusWeeks(1);

        long uploadsThisWeek = mongoTemplate.count(
                Query.query(Criteria.where("createdAt").gte(startOfWeek)), Note.class);
        long uploadsLastWeek = mongoTemplate.count(
                Query.query(Criteria.where("createdAt").gte(startOfLastWeek).lt(startOfWeek)), Note.class);

        result.put("uploadsThisWeek", uploadsThisWeek);
        result.put("uploadsLastWeek", uploadsLastWeek);

        // Total uploads this month
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        long uploadsThisMonth = mongoTemplate.count(
                Query.query(Criteria.where("createdAt").gte(startOfMonth)), Note.class);
        result.put("uploadsThisMonth", uploadsThisMonth);

        // Total download sum
        Aggregation downloadAgg = Aggregation.newAggregation(
                Aggregation.group().sum("downloads").as("totalDownloads")
        );
        AggregationResults<Map> downloadResult = mongoTemplate.aggregate(downloadAgg, "notes", Map.class);
        long totalDownloads = 0;
        if (!downloadResult.getMappedResults().isEmpty()) {
            Object val = downloadResult.getMappedResults().get(0).get("totalDownloads");
            if (val instanceof Number) totalDownloads = ((Number) val).longValue();
        }
        result.put("totalDownloads", totalDownloads);
        result.put("totalUploads", noteRepository.count());

        return result;
    }

    /**
     * Top 10 most downloaded notes.
     */
    public List<Map<String, Object>> getTopDownloaded() {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "downloads"))
                .limit(10);
        List<Note> notes = mongoTemplate.find(query, Note.class);

        return notes.stream().map(n -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", n.getId());
            entry.put("title", n.getTitle());
            entry.put("subject", n.getSubject());
            entry.put("downloads", n.getDownloads());
            entry.put("likes", n.getLikesCount());
            entry.put("uploaderName", n.getUploaderName());
            entry.put("college", n.getCollege());
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Trending subjects: aggregation by subject, sorted by total downloads.
     */
    public List<Map<String, Object>> getTrendingSubjects() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.group("subject")
                        .count().as("noteCount")
                        .sum("downloads").as("totalDownloads")
                        .sum("likesCount").as("totalLikes"),
                Aggregation.sort(Sort.Direction.DESC, "totalDownloads"),
                Aggregation.limit(10)
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "notes", Map.class);

        return results.getMappedResults().stream().map(doc -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("subject", doc.get("_id"));
            entry.put("noteCount", doc.get("noteCount"));
            entry.put("totalDownloads", doc.get("totalDownloads"));
            entry.put("totalLikes", doc.get("totalLikes"));
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Notes pending approval (verified=false), sorted by createdAt desc.
     */
    public List<Map<String, Object>> getPendingApproval() {
        Query query = new Query(Criteria.where("verified").is(false).and("archived").is(false))
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(50);
        List<Note> notes = mongoTemplate.find(query, Note.class);

        return notes.stream().map(n -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", n.getId());
            entry.put("title", n.getTitle());
            entry.put("subject", n.getSubject());
            entry.put("uploaderName", n.getUploaderName());
            entry.put("college", n.getCollege());
            entry.put("semester", n.getSemester());
            entry.put("createdAt", n.getCreatedAt().toString());
            entry.put("downloads", n.getDownloads());
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Note request stats and recent requests.
     */
    public Map<String, Object> getNoteRequestStats() {
        Map<String, Object> result = new LinkedHashMap<>();

        long totalRequests = noteRequestRepository.count();
        long openRequestsCount = noteRequestRepository.countByFulfilledFalse();
        long fulfilledRequests = totalRequests - openRequestsCount;

        result.put("totalRequests", totalRequests);
        result.put("openRequests", openRequestsCount);
        result.put("fulfilledRequests", fulfilledRequests);

        // Recent requests (up to 20)
        List<NoteRequest> recentOpenRequests = noteRequestRepository.findTop20ByFulfilledFalseOrderByCreatedAtDesc();
        List<Map<String, Object>> recent = recentOpenRequests.stream().map(r -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", r.getId());
            entry.put("subject", r.getSubject());
            entry.put("semester", r.getSemester());
            entry.put("description", r.getDescription());
            entry.put("requesterName", r.getRequesterName());
            entry.put("createdAt", r.getCreatedAt().toString());
            entry.put("fulfilled", r.isFulfilled());
            return entry;
        }).collect(Collectors.toList());
        result.put("recentRequests", recent);

        return result;
    }

    /**
     * University/college analytics: notes per college, downloads per college.
     */
    public List<Map<String, Object>> getUniversityStats() {
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("college").ne(null).ne("")),
                Aggregation.group("college")
                        .count().as("noteCount")
                        .sum("downloads").as("totalDownloads")
                        .sum("likesCount").as("totalLikes"),
                Aggregation.sort(Sort.Direction.DESC, "noteCount"),
                Aggregation.limit(15)
        );
        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "notes", Map.class);

        return results.getMappedResults().stream().map(doc -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("college", doc.get("_id"));
            entry.put("noteCount", doc.get("noteCount"));
            entry.put("totalDownloads", doc.get("totalDownloads"));
            entry.put("totalLikes", doc.get("totalLikes"));
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Search analytics: top queries, search volume over time.
     */
    public Map<String, Object> getSearchAnalytics() {
        Map<String, Object> result = new LinkedHashMap<>();

        // Top search queries by frequency
        Aggregation topQueryAgg = Aggregation.newAggregation(
                Aggregation.group("query").count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.limit(15)
        );
        AggregationResults<Map> topResults = mongoTemplate.aggregate(topQueryAgg, "search_logs", Map.class);

        List<Map<String, Object>> topQueries = topResults.getMappedResults().stream().map(doc -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("query", doc.get("_id"));
            entry.put("count", doc.get("count"));
            return entry;
        }).collect(Collectors.toList());
        result.put("topQueries", topQueries);

        // Daily search volume over last 14 days
        LocalDateTime fourteenDaysAgo = LocalDate.now().minusDays(14).atStartOfDay();
        Aggregation volumeAgg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("createdAt").gte(fourteenDaysAgo)),
                Aggregation.project()
                        .andExpression("dateToString('%Y-%m-%d', createdAt)").as("date"),
                Aggregation.group("date").count().as("count"),
                Aggregation.sort(Sort.Direction.ASC, "_id")
        );
        AggregationResults<Map> volumeResults = mongoTemplate.aggregate(volumeAgg, "search_logs", Map.class);

        List<Map<String, Object>> dailyVolume = volumeResults.getMappedResults().stream().map(doc -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", doc.get("_id"));
            entry.put("count", doc.get("count"));
            return entry;
        }).collect(Collectors.toList());
        result.put("dailyVolume", dailyVolume);

        result.put("totalSearches", searchLogRepository.count());

        return result;
    }

    /**
     * Recent activities: last 50 uploads across the platform.
     */
    public List<Map<String, Object>> getRecentActivities() {
        Query query = new Query()
                .with(Sort.by(Sort.Direction.DESC, "createdAt"))
                .limit(50);
        List<Note> recentNotes = mongoTemplate.find(query, Note.class);

        return recentNotes.stream().map(n -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("type", "upload");
            entry.put("description", n.getUploaderName() + " uploaded \"" + n.getTitle() + "\"");
            entry.put("subject", n.getSubject());
            entry.put("college", n.getCollege());
            entry.put("timestamp", n.getCreatedAt().toString());
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Approve a note (set verified=true).
     * Awards 5 points to the uploader.
     */
    public Note approveNote(String noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        
        if (!note.isVerified()) {
            note.setVerified(true);
            note = noteRepository.save(note);
        }
        
        return note;
    }

    /**
     * Get all archived notes for the Admin Dashboard.
     */
    public List<Map<String, Object>> getArchivedNotes() {
        List<Note> notes = noteRepository.findByArchivedTrueOrderByCreatedAtDesc();

        return notes.stream().map(n -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", n.getId());
            entry.put("title", n.getTitle());
            entry.put("subject", n.getSubject());
            entry.put("uploaderName", n.getUploaderName());
            entry.put("college", n.getCollege());
            entry.put("createdAt", n.getCreatedAt().toString());
            entry.put("verified", n.isVerified());
            return entry;
        }).collect(Collectors.toList());
    }

    /**
     * Soft delete (archive) a note.
     */
    public Note archiveNote(String noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        note.setArchived(true);
        note = noteRepository.save(note);
        return note;
    }

    /**
     * Restore an archived note.
     */
    public Note restoreNote(String noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        note.setArchived(false);
        note = noteRepository.save(note);
        return note;
    }

    /**
     * Permanently delete a note from the database.
     */
    public void permanentlyDeleteNote(String noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        noteRepository.deleteById(noteId);
    }
}
