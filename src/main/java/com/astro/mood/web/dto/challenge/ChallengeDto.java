package com.astro.mood.web.dto.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public class ChallengeDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private String title;
        private String description;
        private Integer durationDays;
        private String imageUrl;
        private Boolean isActive;
        private String rules;
        private String rewards;
        private BigDecimal entryFee;
        private BigDecimal refundRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ListResponse {
        private Integer challengeIdx;
        private String title;
        private String description;
        private Integer durationDays;
        private String type; // "NORMAL", "TRAVEL", "GUIDE"
        private Integer participantCount;
        private Boolean isActive;
        private String imageUrl;
        private Boolean isParticipating; // 현재 사용자가 참여 중인지
        private Integer progressDays; // 진행 일수
        private BigDecimal completionRate; // 완료율

        public static ListResponse fromEntityWithParticipation(Challenge challenge, Boolean isParticipating) {
            return ListResponse.builder()
                    .challengeIdx(challenge.getChallengeIdx())
                    .title(challenge.getTitle())
                    .description(challenge.getDescription())
                    .durationDays(challenge.getDurationDays())
                    .type(challenge.getType()) // type 필드 추가
                    .participantCount(challenge.getParticipantCount())
                    .isActive(challenge.getIsActive())
                    .imageUrl(challenge.getImageUrl())
                    .isParticipating(isParticipating)
                    .progressDays(0) // 기본값
                    .completionRate(BigDecimal.ZERO) // 기본값
                    .build();
        }

        public static ListResponse fromEntityWithParticipationAndProgress(Challenge challenge, Boolean isParticipating,
                Integer progressDays, BigDecimal completionRate) {
            return ListResponse.builder()
                    .challengeIdx(challenge.getChallengeIdx())
                    .title(challenge.getTitle())
                    .description(challenge.getDescription())
                    .durationDays(challenge.getDurationDays())
                    .type(challenge.getType()) // type 필드 추가
                    .participantCount(challenge.getParticipantCount())
                    .isActive(challenge.getIsActive())
                    .imageUrl(challenge.getImageUrl())
                    .isParticipating(isParticipating)
                    .progressDays(progressDays != null ? progressDays : 0)
                    .completionRate(completionRate != null ? completionRate : BigDecimal.ZERO)
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Integer challengeIdx;
        private String title;
        private String description;
        private Integer durationDays;
        private String type; // "NORMAL", "TRAVEL", "GUIDE"
        private Integer participantCount;
        private Boolean isActive;
        private String imageUrl;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Boolean isParticipating; // 현재 사용자가 참여 중인지
        private String rules;
        private String rewards;

        public static Response fromEntity(Challenge challenge) {
            return Response.builder()
                    .challengeIdx(challenge.getChallengeIdx())
                    .title(challenge.getTitle())
                    .description(challenge.getDescription())
                    .durationDays(challenge.getDurationDays())
                    .type(challenge.getType()) // type 필드 추가
                    .participantCount(challenge.getParticipantCount())
                    .isActive(challenge.getIsActive())
                    .imageUrl(challenge.getImageUrl())
                    .createdAt(challenge.getCreatedAt())
                    .updatedAt(challenge.getUpdatedAt())
                    .rules(challenge.getRules())
                    .rewards(challenge.getRewards())
                    .build();
        }

        public static Response fromEntityWithParticipation(Challenge challenge, Boolean isParticipating) {
            Response response = fromEntity(challenge);
            response.setIsParticipating(isParticipating);
            return response;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String title;
        private String description;
        private Integer durationDays;
        private String imageUrl;
        private Boolean isActive;
        private String rules;
        private String rewards;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipationResponse {
        private Integer participationIdx;
        private Integer challengeIdx;
        private String challengeTitle;
        private Boolean isCompleted;
        private Integer progressDays;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
    }
}