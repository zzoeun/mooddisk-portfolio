package com.astro.mood.service.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

//빌드 테스트
@Slf4j
@Service
@RequiredArgsConstructor
public class ChallengeValidationService {

    private final ChallengeParticipationRepository participationRepository;

    /**
     * 매일 자정에 실행 - 챌린지 기간 만료 및 일일 진행 상황 검증
     */
    @Scheduled(cron = "0 0 0 * * *") // 매일 자정 실행
    @Transactional
    public void validateDailyProgress() {
        log.info("일일 챌린지 검증 시작");

        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime now = LocalDateTime.now();

        // 활성 상태인 모든 참여를 가져옴
        List<ChallengeParticipation> activeParticipations = participationRepository.findByStatus("ACTIVE");

        for (ChallengeParticipation participation : activeParticipations) {
            // 1. 먼저 챌린지 기간 만료 여부 확인
            if (participation.isExpiredAt(now)) {
                handleExpiredParticipation(participation, now);
                continue; // 만료된 경우 일일 검증은 건너뜀
            }

            // 2. 일일 챌린지인 경우 일일 진행 상황 검증
            Challenge challenge = participation.getChallenge();
            if (isDailyChallenge(challenge)) {
                validateParticipation(participation, yesterday);
            }
        }

        log.info("일일 챌린지 검증 완료");
    }

    /**
     * 특정 참여자의 어제 진행 상황 검증
     */
    private void validateParticipation(ChallengeParticipation participation, LocalDate targetDate) {
        // lastCompletedDate를 기준으로 검증
        boolean completedYesterday = participation.getLastCompletedDate() != null &&
                participation.getLastCompletedDate().equals(targetDate);

        if (!completedYesterday) {
            // 어제 완료하지 못함 - 즉시 실패
            handleFailure(participation, targetDate, "MISSED_DAY");
            log.info("참여자 {}의 챌린지 {} 실패 처리 ({}일 누락)",
                    participation.getUser().getUserIdx(),
                    participation.getChallenge().getTitle(),
                    targetDate);
        }
    }

    /**
     * 챌린지 실패 처리
     */
    private void handleFailure(ChallengeParticipation participation, LocalDate failedDate, String reason) {
        // 실패 상태로 변경
        participation.markAsFailed(reason, failedDate.atStartOfDay());
        participationRepository.save(participation);
    }

    /**
     * 챌린지 완료 처리
     */
    private void handleCompletion(ChallengeParticipation participation) {
        participation.markAsCompleted();
        participationRepository.save(participation);
    }

    /**
     * 만료된 챌린지 참여 처리
     */
    private void handleExpiredParticipation(ChallengeParticipation participation, LocalDateTime now) {
        Challenge challenge = participation.getChallenge();
        Integer requiredDays = challenge.getDurationDays();
        Integer actualDays = participation.getProgressDays();

        log.info("챌린지 기간 만료 처리: participationIdx={}, challenge={}, requiredDays={}, actualDays={}",
                participation.getParticipationIdx(), challenge.getTitle(), requiredDays, actualDays);

        if (actualDays != null && requiredDays != null && actualDays >= requiredDays) {
            // 성공: 요구 일수를 모두 완료함
            handleCompletion(participation);
            log.info("챌린지 성공: participationIdx={}, userIdx={}, challenge={}",
                    participation.getParticipationIdx(), participation.getUser().getUserIdx(), challenge.getTitle());
        } else {
            // 실패: 요구 일수를 완료하지 못함
            participation.markAsFailed("CHALLENGE_EXPIRED", now);
            participationRepository.save(participation);
            log.info("챌린지 실패: participationIdx={}, userIdx={}, challenge={}, completedDays={}/{}",
                    participation.getParticipationIdx(), participation.getUser().getUserIdx(),
                    challenge.getTitle(), actualDays, requiredDays);
        }
    }

    /**
     * 일일 챌린지 여부 확인
     * 카테고리 필드가 제거되어 제목으로 판단
     */
    private boolean isDailyChallenge(Challenge challenge) {
        // 제목에 "일기"가 포함되어 있는지로 판단
        return challenge.getTitle() != null && challenge.getTitle().contains("일기");
    }

    /**
     * 특정 참여자의 진행 상황 강제 검증 (관리자용)
     */
    @Transactional
    public void forceValidateParticipation(Integer participationIdx) {
        ChallengeParticipation participation = participationRepository
                .findById(participationIdx)
                .orElseThrow(() -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다."));

        LocalDate yesterday = LocalDate.now().minusDays(1);
        validateParticipation(participation, yesterday);
    }

}