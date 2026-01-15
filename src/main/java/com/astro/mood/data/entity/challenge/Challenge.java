package com.astro.mood.data.entity.challenge;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDateTime;

@Data
@Entity
@DynamicInsert
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Table(name = "challenge")
public class Challenge {
    @Id
    @Column(name = "challenge_idx")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer challengeIdx;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "type")
    @Builder.Default
    private String type = "NORMAL"; // "NORMAL", "TRAVEL", "GUIDE"

    @Column(name = "participant_count")
    private Integer participantCount;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "image_url")
    private String imageUrl;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rules", columnDefinition = "TEXT")
    private String rules;

    @Column(name = "rewards", columnDefinition = "TEXT")
    private String rewards;

    public void incrementParticipantCount() {
        this.participantCount = (this.participantCount == null ? 0 : this.participantCount) + 1;
    }
}