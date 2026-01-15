package com.astro.mood.data.repository.diary;

import com.astro.mood.data.entity.diary.Diary;
import com.astro.mood.data.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DiaryRepository extends JpaRepository<Diary, Integer> {

        @NonNull
        Optional<Diary> findById(@NonNull Integer diaryIdx);

        @Query("SELECT d FROM Diary d WHERE d.user = :user AND YEAR(d.createdAt) = :year AND MONTH(d.createdAt) = :month AND d.deletedAt IS NULL ORDER BY d.createdAt DESC")
        @NonNull
        List<Diary> findByUserAndMonth(@NonNull @Param("user") User user, @NonNull @Param("year") Integer year,
                        @NonNull @Param("month") Integer month);

        // 단순화된 월별 조회 (이미지 포함)
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.user = :user AND YEAR(d.createdAt) = :year AND MONTH(d.createdAt) = :month AND d.deletedAt IS NULL "
                        +
                        "ORDER BY d.createdAt DESC")
        @NonNull
        List<Diary> findByUserAndMonthWithImages(@NonNull @Param("user") User user,
                        @NonNull @Param("year") Integer year,
                        @NonNull @Param("month") Integer month);

        // 감정비트맵용 1년치 일기 조회 (성능 최적화 - 감정 정보만)
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.user = :user AND YEAR(d.createdAt) = :year AND d.deletedAt IS NULL " +
                        "ORDER BY d.createdAt DESC")
        List<Diary> findByUserAndYearForEmotionBitmap(@NonNull @Param("user") User user,
                        @NonNull @Param("year") Integer year);

        @Query("SELECT COUNT(d) FROM Diary d WHERE d.user.userIdx = :userIdx AND d.deletedAt IS NULL")
        int countByUserUserIdx(@NonNull @Param("userIdx") Integer userIdx);

        @NonNull
        @Query("SELECT d FROM Diary d WHERE d.user = :user AND d.createdAt BETWEEN :start AND :end AND d.deletedAt IS NULL ORDER BY d.createdAt DESC LIMIT 1")
        Diary findTopByUserAndCreatedAtBetweenOrderByCreatedAtDesc(
                        @NonNull @Param("user") User user,
                        @NonNull @Param("start") LocalDateTime start,
                        @NonNull @Param("end") LocalDateTime end);

        // 휴지통 관련 메서드들
        @Query("SELECT d FROM Diary d WHERE d.user = :user AND d.deletedAt IS NOT NULL ORDER BY d.deletedAt DESC")
        List<Diary> findDeletedDiariesByUser(@NonNull @Param("user") User user);

        // 휴지통 조회 (이미지 포함)
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.user = :user AND d.deletedAt IS NOT NULL " +
                        "ORDER BY d.deletedAt DESC")
        List<Diary> findDeletedDiariesByUserWithImages(@NonNull @Param("user") User user);

        @Query("SELECT d FROM Diary d WHERE d.deletedAt IS NOT NULL AND d.deletedAt < :thirtyDaysAgo")
        List<Diary> findDiariesForPermanentDeletion(@NonNull @Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo);

        @Query("SELECT d FROM Diary d WHERE d.diaryIdx = :diaryIdx AND d.deletedAt IS NULL")
        Optional<Diary> findActiveById(@NonNull @Param("diaryIdx") Integer diaryIdx);

        // 개별 일기 조회 (이미지 포함)
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.diaryIdx = :diaryIdx AND d.deletedAt IS NULL")
        Optional<Diary> findActiveByIdWithImages(@NonNull @Param("diaryIdx") Integer diaryIdx);

        // 통계 관련 메서드들 (네이티브 쿼리 사용)
        @Query(value = "SELECT MIN(DATE(created_at)) FROM diary WHERE user_idx = :loginIdx AND deleted_at IS NULL", nativeQuery = true)
        LocalDate findFirstRecordDateByUser(@NonNull @Param("loginIdx") Integer loginIdx);

        @Query(value = "SELECT COUNT(*) FROM diary WHERE user_idx = :loginIdx AND DATE(created_at) = :date AND deleted_at IS NULL", nativeQuery = true)
        Long countByUserLoginIdxAndDate(@NonNull @Param("loginIdx") Integer loginIdx,
                        @NonNull @Param("date") LocalDate date);

        @Query(value = "SELECT COUNT(*) FROM diary WHERE user_idx = :loginIdx AND deleted_at IS NULL", nativeQuery = true)
        Long countByUserLoginIdxAndIsDeletedFalse(@NonNull @Param("loginIdx") Integer loginIdx);

        // 사용자의 모든 일기 조회 (ACL 수정용)
        @Query("SELECT d FROM Diary d WHERE d.user.userIdx = :userIdx AND d.deletedAt IS NULL")
        List<Diary> findByUserIdx(@NonNull @Param("userIdx") Integer userIdx);

        // 특정 날짜의 모든 일기 조회 (시간순 정렬 - 오래된 순)
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.user = :user AND DATE(d.createdAt) = :date AND d.deletedAt IS NULL " +
                        "ORDER BY d.createdAt ASC")
        List<Diary> findByUserAndDateOrderByCreatedAtAsc(@NonNull @Param("user") User user,
                        @NonNull @Param("date") LocalDate date);

        // 챌린지 참여별 일기 조회 (정확한 연동)
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.challengeParticipationIdx = :participationIdx AND d.deletedAt IS NULL " +
                        "ORDER BY d.createdAt DESC")
        List<Diary> findByChallengeParticipationIdxOrderByCreatedAtDesc(
                        @NonNull @Param("participationIdx") Integer participationIdx);

        // 사용자 관련 모든 일기 삭제 (회원탈퇴 시)
        @Modifying
        @Query("DELETE FROM Diary d WHERE d.user.userIdx = :userIdx")
        void deleteByUserIdx(@NonNull @Param("userIdx") Integer userIdx);

        // 챌린지의 모든 참여 기간 일기 조회
        @Query("SELECT d FROM Diary d " +
                        "WHERE d.challengeParticipationIdx IN :participationIdxList AND d.deletedAt IS NULL " +
                        "ORDER BY d.createdAt DESC")
        List<Diary> findByChallengeParticipationIdxInOrderByCreatedAtDesc(
                        @NonNull @Param("participationIdxList") List<Integer> participationIdxList);

        // 특정 챌린지 참여의 가장 최근 일기 날짜 조회
        @Query("SELECT MAX(d.createdAt) FROM Diary d " +
                        "WHERE d.challengeParticipationIdx = :participationIdx AND d.deletedAt IS NULL")
        Optional<LocalDateTime> findMostRecentDiaryDateByParticipationIdx(
                        @NonNull @Param("participationIdx") Integer participationIdx);

        // 특정 날짜에 해당 챌린지로 작성된 일기가 있는지 확인 (현재 수정 중인 일기 제외)
        @Query("SELECT COUNT(d) > 0 FROM Diary d " +
                        "WHERE d.challengeParticipationIdx = :participationIdx " +
                        "AND DATE(d.createdAt) = :date " +
                        "AND d.deletedAt IS NULL " +
                        "AND d.diaryIdx != :excludeDiaryIdx")
        boolean existsByChallengeParticipationIdxAndDateExcludingDiary(
                        @NonNull @Param("participationIdx") Integer participationIdx,
                        @NonNull @Param("date") LocalDate date,
                        @NonNull @Param("excludeDiaryIdx") Integer excludeDiaryIdx);
}
