package com.astro.mood.web.dto.challenge;

import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * 여행 로그 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelLogResponse {

    private Integer participationIdx;
    private Integer challengeIdx;
    private String logName;
    private String destinations; // JSON 문자열
    private LocalDateTime departureDate; // startedAt
    private LocalDateTime returnDate; // endedAt
    private Integer durationDays; // 여행 기간 (일수)
    private String status;
    private Integer progressDays;
    private Double completionRate;

    /**
     * ChallengeParticipation 엔티티로부터 응답 생성
     */
    public static TravelLogResponse fromEntity(ChallengeParticipation participation) {
        // 저장된 durationDays 사용 (TRAVEL 로그 생성 시 계산되어 저장됨)
        // 만약 null이면 계산 (하위 호환성을 위해)
        Integer durationDays = participation.getDurationDays();
        if (durationDays == null && participation.getStartedAt() != null && participation.getEndedAt() != null) {
            durationDays = (int) ChronoUnit.DAYS.between(
                    participation.getStartedAt().toLocalDate(),
                    participation.getEndedAt().toLocalDate()) + 1; // 출발일과 귀국일 모두 포함
        }

        return TravelLogResponse.builder()
                .participationIdx(participation.getParticipationIdx())
                .challengeIdx(
                        participation.getChallenge() != null ? participation.getChallenge().getChallengeIdx() : null)
                .logName(participation.getLogName())
                .destinations(participation.getDestinations())
                .departureDate(participation.getStartedAt())
                .returnDate(participation.getEndedAt())
                .durationDays(durationDays)
                .status(participation.getStatus())
                .progressDays(participation.getProgressDays())
                .completionRate(participation.getCompletionRate())
                .build();
    }
}
