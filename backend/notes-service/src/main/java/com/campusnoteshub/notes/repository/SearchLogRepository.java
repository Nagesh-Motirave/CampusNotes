package com.campusnoteshub.notes.repository;

import com.campusnoteshub.notes.model.SearchLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchLogRepository extends MongoRepository<SearchLog, String> {
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    List<SearchLog> findTop50ByOrderByCreatedAtDesc();
}
