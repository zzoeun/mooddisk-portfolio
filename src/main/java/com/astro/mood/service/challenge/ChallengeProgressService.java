package com.astro.mood.service.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.entity.diary.Diary;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import com.astro.mood.data.repository.diary.DiaryRepository;
import com.astro.mood.web.dto.challenge.ChallengeCompletionResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChallengeProgressService {

    private final ChallengeParticipationRepository participationRepository;
    private final DiaryRepository diaryRepository;

    /**
     * 일기 작성 시 관련 챌린지 진행도 업데이트
     * 
     * @return 챌린지 완료 여부와 메시지
     */
    @Transactional
    public ChallengeCompletionResult updateProgressOnDiaryWrite(Diary diary) {
        return updateProgressOnDiaryWrite(diary, false);
    }

    /**
     * 일기 작성 시 관련 챌린지 진행도 업데이트 (강제 업데이트 옵션 포함)
     * 
     * @param forceUpdate true면 중복 체크를 무시하고 강제로 업데이트
     * @return 챌린지 완료 여부와 메시지
     */
    @Transactional
    public ChallengeCompletionResult updateProgressOnDiaryWrite(Diary diary, boolean forceUpdate) {
        LocalDate diaryDate = diary.getCreatedAt().toLocalDate();
        Integer challengeParticipationIdx = diary.getChallengeParticipationIdx();

        log.info("일기 작성 시 챌린지 진행도 업데이트 시작: diaryIdx={}, challengeParticipationIdx={}, date={}, forceUpdate={}",
                diary.getDiaryIdx(), challengeParticipationIdx, diaryDate, forceUpdate);

        // 일기가 특정 챌린지와 연결된 경우에만 진행도 업데이트
        if (challengeParticipationIdx != null) {
            try {
                ChallengeParticipation participation = participationRepository
                        .findById(challengeParticipationIdx)
                        .orElseThrow(
                                () -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다: " + challengeParticipationIdx));

                if ("ACTIVE".equals(participation.getStatus())) {
                    ChallengeCompletionResult result = updateDailyProgress(participation, diaryDate, forceUpdate);
                    log.info("챌린지 진행도 업데이트 완료: participationIdx={}, progressDays={}, isCompleted={}",
                            challengeParticipationIdx, participation.getProgressDays(), result.isCompleted());
                    return result;
                } else {
                    log.warn("활성 상태가 아닌 챌린지 참여: participationIdx={}, status={}",
                            challengeParticipationIdx, participation.getStatus());
                }
            } catch (Exception e) {
                log.error("챌린지 진행도 업데이트 실패: participationIdx={}", challengeParticipationIdx, e);
            }
        } else {
            log.debug("일반 일기 작성 (챌린지와 연결되지 않음): diaryIdx={}", diary.getDiaryIdx());
        }

        return ChallengeCompletionResult.notCompleted();
    }

    /**
     * 특정 참여의 일일 진행도 업데이트 (강제 업데이트 옵션 포함)
     * 
     * @param forceUpdate true면 중복 체크를 무시하고 강제로 업데이트
     * @return 챌린지 완료 여부와 메시지
     */
    private ChallengeCompletionResult updateDailyProgress(ChallengeParticipation participation, LocalDate date,
            boolean forceUpdate) {
        // TRAVEL 로그의 경우 출발일 ~ 귀국일 사이의 일기만 카운트
        if (participation.getChallenge() != null && "TRAVEL".equals(participation.getChallenge().getType())) {
            LocalDate startDate = participation.getStartedAt() != null
                    ? participation.getStartedAt().toLocalDate()
                    : null;
            LocalDate endDate = participation.getEndedAt() != null
                    ? participation.getEndedAt().toLocalDate()
                    : null;

            // 출발일 이전이면 진행도 업데이트하지 않음
            if (startDate != null && date.isBefore(startDate)) {
                log.debug("TRAVEL 로그: 출발일 이전 일기는 진행도에 포함하지 않음: participationIdx={}, date={}, startDate={}",
                        participation.getParticipationIdx(), date, startDate);
                return ChallengeCompletionResult.notCompleted();
            }
            // 귀국일 이후면 진행도 업데이트하지 않음
            if (endDate != null && date.isAfter(endDate)) {
                log.debug("TRAVEL 로그: 귀국일 이후 일기는 진행도에 포함하지 않음: participationIdx={}, date={}, endDate={}",
                        participation.getParticipationIdx(), date, endDate);
                return ChallengeCompletionResult.notCompleted();
            }
        }

        // 이미 해당 날짜에 완료했는지 확인 (강제 업데이트가 아닌 경우에만)
        if (!forceUpdate && participation.getLastCompletedDate() != null &&
                participation.getLastCompletedDate().equals(date)) {
            log.debug("이미 완료된 날짜입니다: participationIdx={}, date={}",
                    participation.getParticipationIdx(), date);
            return ChallengeCompletionResult.notCompleted();
        }

        // 완료 처리
        participation.setLastCompletedDate(date);
        participation.incrementProgress();

        // 챌린지 완료 여부 확인
        ChallengeCompletionResult completionResult = checkAndMarkChallengeCompletion(participation, date);
        if (completionResult.isCompleted()) {
            return completionResult;
        }

        participationRepository.save(participation);

        log.info("챌린지 진행도 업데이트: participationIdx={}, date={}, progressDays={}",
                participation.getParticipationIdx(), date, participation.getProgressDays());

        return ChallengeCompletionResult.notCompleted();
    }

    /**
     * 챌린지 참여 정보 조회
     */
    public ChallengeParticipation getParticipationById(Integer participationIdx) {
        return participationRepository.findById(participationIdx).orElse(null);
    }

    /**
     * 챌린지 참여 정보 저장
     */
    public ChallengeParticipation saveParticipation(ChallengeParticipation participation) {
        return participationRepository.save(participation);
    }

    /**
     * 챌린지 진행도 감소 시 lastCompletedDate 업데이트
     */
    @Transactional
    public void decrementProgressWithLastCompletedDateUpdate(ChallengeParticipation participation,
            LocalDate removedDate) {
        participation.decrementProgress();

        // 진행도가 0이 되면 lastCompletedDate도 null로 설정
        if (participation.getProgressDays() == 0) {
            participation.setLastCompletedDate(null);
        } else {
            // 진행도가 1 이상이면 가장 최근 완료 날짜로 lastCompletedDate 업데이트
            LocalDate mostRecentDate = findMostRecentCompletedDate(participation.getParticipationIdx());
            participation.setLastCompletedDate(mostRecentDate);
        }

        participation.updateCompletionRate();
        participationRepository.save(participation);
    }

    /**
     * 해당 챌린지 참여의 가장 최근 완료 날짜 조회
     */
    private LocalDate findMostRecentCompletedDate(Integer participationIdx) {
        // Diary 테이블에서 해당 챌린지 참여의 가장 최근 일기 날짜 조회
        return diaryRepository.findMostRecentDiaryDateByParticipationIdx(participationIdx)
                .map(LocalDateTime::toLocalDate)
                .orElse(null);
    }

    /**
     * 챌린지 완료 여부 확인 및 완료 처리
     * 
     * @param participation 챌린지 참여 정보
     * @param date          확인할 날짜
     * @return 챌린지 완료 여부와 메시지
     */
    private ChallengeCompletionResult checkAndMarkChallengeCompletion(ChallengeParticipation participation,
            LocalDate date) {
        Challenge challenge = participation.getChallenge();

        // TRAVEL 로그는 participation의 durationDays 사용, NORMAL 로그는 challenge의 durationDays
        // 사용
        Integer durationDays;
        if (challenge != null && "TRAVEL".equals(challenge.getType())) {
            durationDays = participation.getDurationDays();
        } else {
            durationDays = challenge != null ? challenge.getDurationDays() : null;
        }

        if (durationDays == null || durationDays <= 0) {
            log.warn("챌린지 기간이 설정되지 않음: participationIdx={}, type={}",
                    participation.getParticipationIdx(), challenge != null ? challenge.getType() : "null");
            return ChallengeCompletionResult.notCompleted();
        }

        // 챌린지 마지막 날에 일기를 작성했는지 확인
        LocalDate startDate = participation.getStartedAt().toLocalDate();
        LocalDate lastDay = startDate.plusDays(durationDays - 1);
        boolean isLastDay = date.equals(lastDay);

        // 챌린지 완료 체크: 마지막 날에 일기를 작성했거나, 요구 일수를 모두 완료한 경우
        if (isLastDay || participation.getProgressDays() >= durationDays) {
            participation.markAsCompleted();
            participationRepository.save(participation);

            log.info("챌린지 성공! participationIdx={}, challenge={}, progressDays={}, isLastDay={}",
                    participation.getParticipationIdx(), challenge.getTitle(),
                    participation.getProgressDays(), isLastDay);

            return ChallengeCompletionResult.success(
                    challenge.getTitle(),
                    participation.getProgressDays(),
                    durationDays);
        }

        return ChallengeCompletionResult.notCompleted();
    }

    /**
     * 일기 수정 시 새 챌린지 진행도 업데이트 (중복 체크 포함)
     */
    @Transactional
    public ChallengeCompletionResult updateProgressOnDiaryUpdateForNewChallenge(Diary diary) {
        LocalDate diaryDate = diary.getCreatedAt().toLocalDate();
        Integer challengeParticipationIdx = diary.getChallengeParticipationIdx();

        log.info("일기 수정 시 새 챌린지 진행도 업데이트: diaryIdx={}, challengeParticipationIdx={}, date={}",
                diary.getDiaryIdx(), challengeParticipationIdx, diaryDate);

        if (challengeParticipationIdx != null) {
            try {
                ChallengeParticipation participation = participationRepository
                        .findById(challengeParticipationIdx)
                        .orElseThrow(
                                () -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다: " + challengeParticipationIdx));

                if ("ACTIVE".equals(participation.getStatus())) {
                    // 같은 날짜에 해당 챌린지로 작성된 다른 일기가 있는지 확인 (현재 수정 중인 일기 제외)
                    boolean hasSameDateDiary = diaryRepository.existsByChallengeParticipationIdxAndDateExcludingDiary(
                            challengeParticipationIdx, diaryDate, diary.getDiaryIdx());

                    if (!hasSameDateDiary) {
                        // 진행도 업데이트
                        ChallengeCompletionResult result = updateDailyProgress(participation, diaryDate, false);
                        log.info("새 챌린지 진행도 업데이트 완료: participationIdx={}, progressDays={}, isCompleted={}",
                                challengeParticipationIdx, participation.getProgressDays(), result.isCompleted());
                        return result;
                    } else {
                        log.info("같은 날짜에 해당 챌린지로 작성된 다른 일기가 있음: participationIdx={}, date={}",
                                challengeParticipationIdx, diaryDate);
                    }
                } else {
                    log.warn("활성 상태가 아닌 챌린지 참여: participationIdx={}, status={}",
                            challengeParticipationIdx, participation.getStatus());
                }
            } catch (Exception e) {
                log.error("새 챌린지 진행도 업데이트 실패: participationIdx={}", challengeParticipationIdx, e);
            }
        }

        return ChallengeCompletionResult.notCompleted();
    }

    /**
     * 챌린지 진행 상황 조회
     */
    public List<ChallengeParticipation> getProgressHistory(Integer participationIdx) {
        ChallengeParticipation participation = participationRepository
                .findById(participationIdx)
                .orElseThrow(() -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다."));

        return List.of(participation); // 현재는 단일 참여 기록만 반환
    }

    /**
     * 연속 성공 일수 계산
     */
    public int calculateConsecutiveDays(Integer participationIdx) {
        ChallengeParticipation participation = participationRepository
                .findById(participationIdx)
                .orElseThrow(() -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다."));

        List<ChallengeParticipation> records = List.of(participation); // 현재는 단일 참여 기록만 계산

        int consecutiveDays = 0;
        LocalDate currentDate = LocalDate.now();

        // 오늘부터 역순으로 연속 성공 일수 계산
        for (int i = records.size() - 1; i >= 0; i--) {
            ChallengeParticipation record = records.get(i);
            if (record.getLastCompletedDate() != null && record.getLastCompletedDate().equals(currentDate)) {
                consecutiveDays++;
                currentDate = currentDate.minusDays(1);
            } else if (record.getLastCompletedDate() == null || !record.getLastCompletedDate().equals(currentDate)) {
                break;
            }
        }

        return consecutiveDays;
    }

    /**
     * 챌린지 완료율 계산
     */
    public double calculateCompletionRate(Integer participationIdx) {
        ChallengeParticipation participation = participationRepository
                .findById(participationIdx)
                .orElseThrow(() -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다."));

        // TRAVEL 로그는 participation의 durationDays 사용, NORMAL 로그는 challenge의 durationDays
        // 사용
        Integer totalDays;
        if (participation.getChallenge() != null && "TRAVEL".equals(participation.getChallenge().getType())) {
            totalDays = participation.getDurationDays();
        } else {
            totalDays = participation.getChallenge() != null ? participation.getChallenge().getDurationDays() : null;
        }

        int completedDays = participation.getProgressDays(); // 현재는 완료된 일수를 직접 사용

        return totalDays != null && totalDays > 0 ? (double) completedDays / totalDays * 100.0 : 0.0;
    }
}