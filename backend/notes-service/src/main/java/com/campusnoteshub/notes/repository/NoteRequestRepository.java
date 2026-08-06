package com.campusnoteshub.notes.repository;

import com.campusnoteshub.notes.model.NoteRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRequestRepository extends MongoRepository<NoteRequest, String> {
    List<NoteRequest> findByFulfilledFalseOrderByCreatedAtDesc();
    
    long countByFulfilledFalse();
    
    List<NoteRequest> findBySubjectIgnoreCaseAndFulfilledFalse(String subject);
    
    List<NoteRequest> findTop20ByFulfilledFalseOrderByCreatedAtDesc();
}
