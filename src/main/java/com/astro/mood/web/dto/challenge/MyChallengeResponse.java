package com.astro.mood.web.dto.challenge;

import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내 챌린지(내가 참여한 챌린지) 관련 DTO만 정의
 * - 전체 챌린지와 분리하여, 내 챌린지 응답 전용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyChallengeResponse {
    /**
     * 참여한 챌린지의 고유 식별자
     */
    private Integer challengeIdx;
    /**
     * 챌린지 제목
     */
    private String title;
    /**
     * 챌린지 설명
     */
    private String description;
    /**
     * 내 진행 상태(예: ACTIVE, COMPLETED 등)
     */
    private String myStatus;
    /**
     * 내 진행률(일 수 등)
     */
    private int myProgress;
    /**
     * 챌린지 총 기간 (일)
     */
    private Integer durationDays;

    /**
     * 챌린지 타입 ("NORMAL", "TRAVEL", "GUIDE")
     */
    private String type;

    /**
     * 여행 로그 전용 필드
     */
    private String logName; // 사용자 지정 로그 이름

    private String destinations; // JSON 문자열 (목적지 정보)

    private String timezone; // 타임존 (예: "Asia/Seoul", "Europe/Paris") - TRAVEL 로그의 경우 여행지 타임존

    /**
     * 마지막으로 완료한 날짜
     */
    private String lastCompletedDate;

    /**
     * 챌린지 시작일
     */
    private String startedAt;

    /**
     * 챌린지 종료일
     */
    private String endedAt;

    /**
     * 참여 인덱스
     */
    private Integer participationIdx;
    // ... 필요시 추가 필드 ...

    /**
     * ChallengeParticipation 엔티티로부터 DTO 생성
     */
    public static MyChallengeResponse fromParticipation(ChallengeParticipation participation) {
        // TRAVEL 로그는 participation의 durationDays 사용, NORMAL 로그는 challenge의 durationDays
        // 사용
        Integer durationDays;
        if (participation.getChallenge() != null && "TRAVEL".equals(participation.getChallenge().getType())) {
            durationDays = participation.getDurationDays();
        } else {
            durationDays = participation.getChallenge() != null ? participation.getChallenge().getDurationDays() : null;
        }

        return MyChallengeResponse.builder()
                .challengeIdx(participation.getChallenge().getChallengeIdx())
                .title(participation.getChallenge().getTitle())
                .description(participation.getChallenge().getDescription())
                .myStatus(participation.getStatus())
                .myProgress(participation.getProgressDays())
                .durationDays(durationDays)
                .type(participation.getChallenge().getType()) // type 필드 추가
                .logName(participation.getLogName()) // 여행 로그 전용 필드
                .destinations(participation.getDestinations()) // 여행 로그 전용 필드
                .timezone(participation.getTimezone()) // 타임존 필드 추가
                .lastCompletedDate(
                        participation.getLastCompletedDate() != null ? participation.getLastCompletedDate().toString()
                                : null)
                .startedAt(participation.getStartedAt() != null ? participation.getStartedAt().toString() : null)
                .endedAt(participation.getEndedAt() != null ? participation.getEndedAt().toString() : null)
                .participationIdx(participation.getParticipationIdx())
                .build();
    }
}