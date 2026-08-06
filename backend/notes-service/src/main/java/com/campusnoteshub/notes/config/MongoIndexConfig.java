package com.campusnoteshub.notes.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

/**
 * Ensures MongoDB indexes exist for frequently queried field combinations.
 * Indexes are created idempotently on startup — if they already exist, this is a no-op.
 */
@Configuration
public class MongoIndexConfig {

    @Autowired
    private MongoTemplate mongoTemplate;

    @PostConstruct
    public void ensureIndexes() {
        // 1. Default public query: verified + non-archived, sorted by date
        mongoTemplate.indexOps("notes").ensureIndex(
                new Index()
                        .on("archived", Sort.Direction.ASC)
                        .on("verified", Sort.Direction.ASC)
                        .on("createdAt", Sort.Direction.DESC)
                        .named("idx_archived_verified_createdAt")
        );

        // 2. Library hierarchy browsing: university → branch → year → semester
        mongoTemplate.indexOps("notes").ensureIndex(
                new Index()
                        .on("archived", Sort.Direction.ASC)
                        .on("verified", Sort.Direction.ASC)
                        .on("university", Sort.Direction.ASC)
                        .on("branch", Sort.Direction.ASC)
                        .on("year", Sort.Direction.ASC)
                        .on("semester", Sort.Direction.ASC)
                        .named("idx_hierarchy_browse")
        );

        // 3. User profile stats aggregation
        mongoTemplate.indexOps("notes").ensureIndex(
                new Index()
                        .on("uploadedBy", Sort.Direction.ASC)
                        .on("verified", Sort.Direction.ASC)
                        .on("archived", Sort.Direction.ASC)
                        .named("idx_uploadedBy_verified_archived")
        );

        // 4. Top notes / most downloaded sorting
        mongoTemplate.indexOps("notes").ensureIndex(
                new Index()
                        .on("downloads", Sort.Direction.DESC)
                        .named("idx_downloads_desc")
        );

        // 5. Liked-by-user queries
        mongoTemplate.indexOps("notes").ensureIndex(
                new Index()
                        .on("likes", Sort.Direction.ASC)
                        .named("idx_likes")
        );

        // 6. Search logs — top queries aggregation
        mongoTemplate.indexOps("search_logs").ensureIndex(
                new Index()
                        .on("query", Sort.Direction.ASC)
                        .named("idx_search_query")
        );

        // 7. Search logs — daily volume
        mongoTemplate.indexOps("search_logs").ensureIndex(
                new Index()
                        .on("createdAt", Sort.Direction.DESC)
                        .named("idx_search_createdAt")
        );
    }
}
