package com.astro.mood.service.challenge;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import com.astro.mood.web.dto.challenge.MyChallengeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 내 챌린지(내가 참여한 챌린지) 관련 비즈니스 로직만 담당하는 서비스
 * - 전체 챌린지와 분리
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MyChallengeService {
    private final ChallengeParticipationRepository participationRepository;

    /**
     * 내가 참여한 챌린지 목록 조회
     * 
     * @param user 사용자 엔티티
     * @return 내가 참여한 챌린지 DTO 목록
     */
    public List<MyChallengeResponse> getMyChallengeList(User user) {
        List<ChallengeParticipation> participations = participationRepository.findByUserOrderByStartedAtDesc(user);
        return participations.stream()
                .map(MyChallengeResponse::fromParticipation)
                .collect(Collectors.toList());
    }

    /**
     * 특정 날짜에 활성화된 내 챌린지 목록 조회 (일기 수정용)
     * 일기 수정 시에는 모든 상태(ACTIVE, PENDING, COMPLETED, FAILED)의 챌린지를 포함
     * 
     * @param user       사용자 엔티티
     * @param targetDate 기준 날짜 (이 날짜에 챌린지 기간 내에 있는 챌린지 조회)
     * @return 특정 날짜에 챌린지 기간 내에 있는 내 챌린지 DTO 목록 (모든 상태 포함)
     */
    public List<MyChallengeResponse> getMyChallengeListBeforeDate(User user, LocalDateTime targetDate) {
        List<ChallengeParticipation> participations = participationRepository.findByUserOrderByStartedAtDesc(user);
        log.info("특정 날짜 챌린지 조회 (일기 수정용): targetDate={}, 전체 참여 수={}", targetDate, participations.size());

        List<MyChallengeResponse> result = participations.stream()
                .filter(participation -> {
                    // 챌린지 기간 내에 있는지 확인: startedAt <= targetDate <= endedAt
                    boolean isWithinPeriod = !participation.getStartedAt().isAfter(targetDate) &&
                            !participation.getEndedAt().isBefore(targetDate);

                    // 일기 수정 시에는 모든 상태 포함 (ACTIVE, PENDING, COMPLETED, FAILED)
                    // 단, 챌린지 기간 내에 있어야 함
                    boolean shouldInclude = isWithinPeriod;

                    log.info(
                            "챌린지 필터링: challengeIdx={}, startedAt={}, endedAt={}, status={}, isWithinPeriod={}, shouldInclude={}",
                            participation.getChallenge().getChallengeIdx(),
                            participation.getStartedAt(),
                            participation.getEndedAt(),
                            participation.getStatus(),
                            isWithinPeriod,
                            shouldInclude);
                    return shouldInclude;
                })
                .map(MyChallengeResponse::fromParticipation)
                .collect(Collectors.toList());

        log.info("필터링 결과: targetDate={}, 필터링된 챌린지 수={}", targetDate, result.size());
        return result;
    }
}