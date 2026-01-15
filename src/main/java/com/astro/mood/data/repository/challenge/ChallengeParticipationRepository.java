package com.astro.mood.data.repository.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChallengeParticipationRepository extends JpaRepository<ChallengeParticipation, Integer> {

    Optional<ChallengeParticipation> findByChallengeAndUser(Challenge challenge, User user);

    /**
     * 특정 챌린지와 사용자의 활성 참여만 조회
     */
    Optional<ChallengeParticipation> findByChallengeAndUserAndStatus(Challenge challenge, User user, String status);

    /**
     * 특정 챌린지와 사용자의 모든 참여 기록 조회 (최신 순)
     */
    List<ChallengeParticipation> findAllByChallengeAndUserOrderByStartedAtDesc(Challenge challenge, User user);

    /**
     * 사용자가 참여한 챌린지 목록을 Challenge까지 fetch join으로 한 번에 조회
     * (LazyInitializationException 방지)
     */
    @Query("SELECT cp FROM ChallengeParticipation cp JOIN FETCH cp.challenge WHERE cp.user = :user ORDER BY cp.startedAt DESC")
    List<ChallengeParticipation> findByUserOrderByStartedAtDesc(@Param("user") User user);

    List<ChallengeParticipation> findByUserAndStatusIn(User user, List<String> statuses);

    Integer countByChallengeAndIsCompleted(Challenge challenge, Boolean isCompleted);

    // 챌린지 검증을 위한 메서드들
    List<ChallengeParticipation> findByStatus(String status);

    List<ChallengeParticipation> findByChallengeAndStatus(Challenge challenge, String status);

    /**
     * 여러 상태의 챌린지 참여를 한 번에 조회 (예: PENDING, ACTIVE)
     */
    @Query("SELECT cp FROM ChallengeParticipation cp WHERE cp.status IN :statuses")
    List<ChallengeParticipation> findByStatusIn(@Param("statuses") List<String> statuses);

    // 사용자 챌린지 참여 삭제 (회원탈퇴 시)
    @Modifying
    @Query("DELETE FROM ChallengeParticipation cp WHERE cp.user.userIdx = :userIdx")
    void deleteByUserIdx(@Param("userIdx") Integer userIdx);
}