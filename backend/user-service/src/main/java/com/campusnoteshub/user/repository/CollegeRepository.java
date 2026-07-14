package com.campusnoteshub.user.repository;

import com.campusnoteshub.user.model.College;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollegeRepository extends MongoRepository<College, String> {

    /** Find a college by its normalized key — primary duplicate detection mechanism. */
    Optional<College> findByNormalizedKey(String normalizedKey);

    /** Find all colleges with a given status (case-insensitive). */
    List<College> findByStatusIgnoreCase(String status);

    /**
     * Search colleges by matching a regex pattern against officialName, shortName, or aliases.
     * Used for the autocomplete dropdown.
     */
    @Query("{ $or: [ " +
           "  { 'officialName': { $regex: ?0, $options: 'i' } }, " +
           "  { 'shortName': { $regex: ?0, $options: 'i' } }, " +
           "  { 'aliases': { $regex: ?0, $options: 'i' } } " +
           "] }")
    List<College> searchByQuery(String regexPattern);
}
