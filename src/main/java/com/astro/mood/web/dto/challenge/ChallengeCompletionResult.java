package com.astro.mood.web.dto.challenge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 챌린지 완료 결과 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeCompletionResult {
    private boolean isCompleted;
    private String challengeTitle;
    private Integer progressDays;
    private Integer requiredDays;
    private String message;

    public static ChallengeCompletionResult success(String challengeTitle, Integer progressDays, Integer requiredDays) {
        return ChallengeCompletionResult.builder()
                .isCompleted(true)
                .challengeTitle(challengeTitle)
                .progressDays(progressDays)
                .requiredDays(requiredDays)
                .message(String.format("🎉 축하합니다! '%s' 챌린지를 성공적으로 완료했습니다! (%d일 완료)",
                        challengeTitle, progressDays))
                .build();
    }

    public static ChallengeCompletionResult notCompleted() {
        return ChallengeCompletionResult.builder()
                .isCompleted(false)
                .build();
    }
}
