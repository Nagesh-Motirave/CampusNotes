package com.campusnoteshub.user.repository;

import com.campusnoteshub.user.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    List<User> findTop10ByOrderByPointsDesc();

    List<User> findTop20ByOrderByCreatedAtDesc();

    long countByRole(String role);

    long countByVerifiedTrue();

    long countByCreatedAtAfter(LocalDateTime date);

    long countByPointsGreaterThan(int points);

    long countByPointsEqualsAndLastPointsUpdateBefore(int points, LocalDateTime lastPointsUpdate);

    @org.springframework.data.mongodb.repository.Query(value = "{}", sort = "{ 'points' : -1, 'lastPointsUpdate' : 1 }")
    List<User> findTop10ByOrderByPointsDescLastPointsUpdateAsc(org.springframework.data.domain.Pageable pageable);
}
