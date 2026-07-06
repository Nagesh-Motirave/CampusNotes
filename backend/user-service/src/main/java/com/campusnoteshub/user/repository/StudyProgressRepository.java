package com.campusnoteshub.user.repository;

import com.campusnoteshub.user.model.StudyProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyProgressRepository extends MongoRepository<StudyProgress, String> {
    List<StudyProgress> findByUserId(String userId);
    Optional<StudyProgress> findByUserIdAndNoteId(String userId, String noteId);
}
