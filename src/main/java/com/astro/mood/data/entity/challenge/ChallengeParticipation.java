package com.astro.mood.data.entity.challenge;

import com.astro.mood.data.entity.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@DynamicInsert
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = { "challenge", "user" })
@Table(name = "challenge_participation")
public class ChallengeParticipation {
    @Id
    @Column(name = "participation_idx")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer participationIdx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_idx")
    private Challenge challenge;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_idx")
    private User user;

    // 챌린지 진행 상태
    @Column(name = "status")
    @Builder.Default
    private String status = "ACTIVE"; // "ACTIVE", "COMPLETED", "FAILED"

    @Column(name = "is_completed")
    @Builder.Default
    private Boolean isCompleted = false;

    @Column(name = "progress_days")
    @Builder.Default
    private Integer progressDays = 0;

    @Column(name = "consecutive_days")
    @Builder.Default
    private Integer consecutiveDays = 0; // 연속 성공 일수

    // 실패 관련
    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    @Column(name = "failure_reason")
    private String failureReason; // "MISSED_DAY", "USER_QUIT", etc.

    @Column(name = "failed_date")
    private LocalDateTime failedDate; // 실패한 날짜

    @Column(name = "completion_rate", columnDefinition = "DECIMAL(10,2)")
    @Builder.Default
    private Double completionRate = 0.0; // 완수율 (%)

    @Column(name = "last_completed_date")
    private LocalDate lastCompletedDate; // 마지막으로 완료한 날짜

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // 여행 로그 전용 필드 (type="TRAVEL"일 때만 사용)
    @Column(name = "log_name")
    private String logName; // 사용자 지정 로그 이름 (예: "도쿄 여행", "유럽 여행")

    @Column(name = "destinations", columnDefinition = "TEXT")
    private String destinations; // JSON 형식의 목적지 정보 (예: [{"lat":48.85,"lon":2.35,"name":"파리","country":"프랑스"}])

    @Column(name = "duration_days")
    private Integer durationDays; // 챌린지 기간 (일수) - TRAVEL 로그는 개별 기간, NORMAL 로그는 null (Challenge.durationDays 사용)

    @Column(name = "timezone")
    private String timezone; // 타임존 (예: "Asia/Seoul", "Europe/Paris") - TRAVEL 로그의 경우 여행지 타임존 저장

    // 비즈니스 메서드들
    public void markAsCompleted() {
        this.isCompleted = true;
        this.status = "COMPLETED";
        this.completedAt = LocalDateTime.now();
    }

    public void markAsFailed(String reason, LocalDateTime failedDate) {
        this.status = "FAILED";
        this.failureReason = reason;
        this.failedAt = LocalDateTime.now();
        this.failedDate = failedDate;
    }

    public void incrementProgress() {
        if (this.progressDays == null)
            this.progressDays = 0;
        this.progressDays++;
        updateCompletionRate();
    }

    public void decrementProgress() {
        if (this.progressDays == null || this.progressDays <= 0)
            this.progressDays = 0;
        else
            this.progressDays--;
        updateCompletionRate();
    }

    public void updateCompletionRate() {
        Integer duration = null;

        // TRAVEL 로그는 participation의 durationDays 사용, NORMAL 로그는 challenge의 durationDays
        // 사용
        if (this.challenge != null && "TRAVEL".equals(this.challenge.getType())) {
            duration = this.durationDays;
        } else if (this.challenge != null) {
            duration = this.challenge.getDurationDays();
        }

        if (duration != null && duration > 0) {
            this.completionRate = (double) this.progressDays / duration * 100.0;
        }
    }

    public void resetConsecutiveDays() {
        this.consecutiveDays = 0;
    }

    /**
     * 챌린지 참여 시작 시 종료일 설정
     * 날짜만 기준으로 계산 (시간은 무시하고 자정으로 설정)
     * 챌린지 마지막 날의 24:00 (다음날 00:00)으로 설정
     * 
     * ⚠️ TRAVEL 로그는 이미 사용자가 입력한 출발일/귀국일로 설정되어 있으므로 자동 계산하지 않음
     */
    public void setEndDate() {
        // TRAVEL 로그는 이미 startedAt(출발일), endedAt(귀국일)이 설정되어 있으므로 skip
        if (this.challenge != null && "TRAVEL".equals(this.challenge.getType())) {
            return;
        }

        // NORMAL 로그만 자동 계산
        if (this.challenge != null && this.challenge.getDurationDays() != null && this.startedAt != null) {
            // 시작일을 날짜만 추출 (시간은 00:00:00으로 설정)
            LocalDate startDate = this.startedAt.toLocalDate();
            // 종료일은 시작일 + 챌린지 기간일 (마지막 날의 24:00, 즉 다음날 00:00)
            this.endedAt = startDate.plusDays(this.challenge.getDurationDays()).atStartOfDay();
        }
    }

    /**
     * 챌린지 기간이 만료되었는지 확인
     * 날짜만 기준으로 비교 (시간은 무시)
     * 종료일 당일부터 만료된 것으로 처리
     */
    public boolean isExpired() {
        if (this.endedAt == null) {
            return false;
        }
        // 오늘 날짜가 종료일 이후이거나 같은지 확인 (종료일 당일부터 만료)
        LocalDate today = LocalDate.now();
        LocalDate endDate = this.endedAt.toLocalDate();
        return today.isAfter(endDate) || today.equals(endDate);
    }

    /**
     * 챌린지 기간이 만료되었는지 특정 시점 기준으로 확인
     * 날짜만 기준으로 비교 (시간은 무시)
     * 종료일 당일부터 만료된 것으로 처리
     */
    public boolean isExpiredAt(LocalDateTime dateTime) {
        if (this.endedAt == null) {
            return false;
        }
        // 특정 날짜가 종료일 이후이거나 같은지 확인 (종료일 당일부터 만료)
        LocalDate checkDate = dateTime.toLocalDate();
        LocalDate endDate = this.endedAt.toLocalDate();
        return checkDate.isAfter(endDate) || checkDate.equals(endDate);
    }
}