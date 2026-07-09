package com.campusnoteshub.notes.repository;

import com.campusnoteshub.notes.model.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends MongoRepository<Note, String> {
    
    // Deprecated: Using custom dynamic query in NoteService for AI search
    // @Query("{ '$and': [ { 'archived': false }, { '$or': [ { 'title': { $regex: ?0, $options: 'i' } }, { 'subject': { $regex: ?0, $options: 'i' } }, { 'subjectName': { $regex: ?0, $options: 'i' } }, { 'branch': { $regex: ?0, $options: 'i' } }, { 'university': { $regex: ?0, $options: 'i' } } ] } ] }")
    // Page<Note> searchByTitleOrSubject(String query, Pageable pageable);

    List<Note> findTop6ByArchivedFalseOrderByDownloadsDesc();
    List<Note> findTop6ByArchivedFalseOrderByLikesCountDesc();
    
    List<Note> findByUploadedByAndArchivedFalse(String uploadedBy);

    /** Returns all distinct college names stored across notes */
    @Query(value = "{ 'archived': false }", fields = "{ 'college': 1, '_id': 0 }")
    List<Note> findAllCollegeFields();

    long countByVerifiedFalseAndArchivedFalse();

    List<Note> findByVerifiedFalseAndArchivedFalseOrderByCreatedAtDesc(Pageable pageable);

    List<Note> findTop10ByArchivedFalseOrderByDownloadsDesc();

    List<Note> findByArchivedTrueOrderByCreatedAtDesc();
}
