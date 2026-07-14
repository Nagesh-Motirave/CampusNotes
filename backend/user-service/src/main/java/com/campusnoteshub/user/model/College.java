package com.campusnoteshub.user.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * College Master entity — stores unique, de-duplicated college records.
 * The normalizedKey field is the primary mechanism for duplicate detection:
 * it stores a lowercased, punctuation-stripped version of the name.
 */
@Document(collection = "colleges")
public class College {

    @Id
    private String id;

    private String officialName;

    private String shortName;

    private List<String> aliases = new ArrayList<>();

    /**
     * Lowercase, dot/space/special-char-stripped version of officialName.
     * Used for fast duplicate detection via index lookup.
     * Example: "D.G.O.I." → "dgoi", "Dattkala Group of Institute" → "dattkalagropofinstitute"
     */
    @Indexed(unique = true)
    private String normalizedKey;

    private String city;

    private String state;

    /** "Verified" or "Pending" */
    private String status = "Pending";

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOfficialName() { return officialName; }
    public void setOfficialName(String officialName) { this.officialName = officialName; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }

    public List<String> getAliases() { return aliases; }
    public void setAliases(List<String> aliases) { this.aliases = aliases; }

    public String getNormalizedKey() { return normalizedKey; }
    public void setNormalizedKey(String normalizedKey) { this.normalizedKey = normalizedKey; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
