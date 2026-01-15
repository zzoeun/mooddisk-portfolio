package com.astro.mood.data.repository.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Integer> {

    @Query("SELECT c FROM Challenge c WHERE c.isActive = true ORDER BY c.createdAt DESC")
    List<Challenge> findActiveChallengesOrderByCreatedAt();

    List<Challenge> findByIsActiveOrderByCreatedAtDesc(Boolean isActive);

    // TRAVEL 타입 챌린지 조회 (템플릿)
    Optional<Challenge> findByTypeAndIsActiveTrue(String type);
}