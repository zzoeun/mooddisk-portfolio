package com.astro.mood.service.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.diary.Diary;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.data.repository.auth.UserTokenRepository;
import com.astro.mood.data.repository.diary.DiaryRepository;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import com.astro.mood.service.s3Image.AwsS3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCleanupService {

    private final AuthRepository authRepository;
    private final UserTokenRepository userTokenRepository;
    private final DiaryRepository diaryRepository;
    private final ChallengeParticipationRepository challengeParticipationRepository;
    private final AwsS3Service awsS3Service;

    /**
     * 매일 새벽 2시에 30일 경과한 탈퇴 사용자들을 완전 삭제
     * 실제 운영에서는 cron = "0 0 2 * * ?" 사용
     * 개발/테스트용으로는 더 짧은 주기로 설정 가능
     */
    @Scheduled(cron = "0 0 2 * * ?") // 매일 새벽 2시
    @Transactional(transactionManager = "tmJpa")
    public void cleanupExpiredUsers() {
        log.info("30일 경과 사용자 정리 작업 시작");

        try {
            // 30일 전 시점 계산
            LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);

            // 30일 이상 경과한 탈퇴 사용자 조회
            List<User> expiredUsers = authRepository.findByIsDeletedTrueAndDeletedAtBefore(thirtyDaysAgo);

            log.info("30일 경과 탈퇴 사용자 {}명 발견", expiredUsers.size());

            for (User user : expiredUsers) {
                try {
                    log.info("사용자 완전삭제 시작 - userIdx: {}, 탈퇴일: {}",
                            user.getUserIdx(), user.getDeletedAt());

                    // 관련 데이터 삭제
                    deleteUserRelatedData(user.getUserIdx());

                    // 사용자 완전 삭제
                    authRepository.delete(user);

                    log.info("사용자 완전삭제 완료 - userIdx: {}", user.getUserIdx());

                } catch (Exception e) {
                    log.error("사용자 완전삭제 실패 - userIdx: {}, error: {}",
                            user.getUserIdx(), e.getMessage(), e);
                }
            }

            log.info("30일 경과 사용자 정리 작업 완료 - 처리된 사용자: {}명", expiredUsers.size());

        } catch (Exception e) {
            log.error("30일 경과 사용자 정리 작업 실패", e);
        }
    }

    /**
     * 사용자 관련 데이터 삭제 (순서: 일기 삭제 → 일기 이미지 S3 삭제 → 사용자 토큰 삭제 → 사용자 삭제)
     */
    private void deleteUserRelatedData(Integer userIdx) {
        log.info("사용자 관련 데이터 삭제 시작 - userIdx: {}", userIdx);

        try {
            // 1. 일기 데이터 삭제 (이미지 URL 수집을 위해 먼저 조회)
            log.info("1단계: 일기 데이터 삭제 중... - userIdx: {}", userIdx);
            List<Diary> userDiaries = diaryRepository.findByUserIdx(userIdx);
            diaryRepository.deleteByUserIdx(userIdx);
            log.info("일기 데이터 삭제 완료 - 삭제된 일기 수: {}", userDiaries.size());

            // 2. 삭제된 일기의 이미지 URL들을 S3에서 삭제
            log.info("2단계: 일기 이미지 S3 삭제 중... - userIdx: {}", userIdx);
            deleteUserDiaryImagesFromS3(userIdx, userDiaries);

            // 3. 사용자 토큰 삭제
            log.info("3단계: 사용자 토큰 삭제 중... - userIdx: {}", userIdx);
            userTokenRepository.deleteByUserIdx(userIdx);

            // 4. 기타 관련 데이터 삭제
            log.info("4단계: 기타 관련 데이터 삭제 중... - userIdx: {}", userIdx);
            challengeParticipationRepository.deleteByUserIdx(userIdx);

            log.info("사용자 관련 데이터 삭제 완료 - userIdx: {}", userIdx);

        } catch (Exception e) {
            log.error("사용자 관련 데이터 삭제 실패 - userIdx: {}, error: {}",
                    userIdx, e.getMessage(), e);
            throw e; // 관련 데이터 삭제 실패 시 사용자 삭제도 중단
        }
    }

    /**
     * 사용자의 모든 일기 이미지를 S3에서 삭제 (이미 조회된 일기 목록 사용)
     */
    private void deleteUserDiaryImagesFromS3(Integer userIdx, List<Diary> userDiaries) {
        try {
            int deletedImageCount = 0;

            for (Diary diary : userDiaries) {
                if (diary.getImageUrls() != null && !diary.getImageUrls().isEmpty()) {
                    for (String imageUrl : diary.getImageUrls()) {
                        if (imageUrl != null && !imageUrl.isEmpty()) {
                            try {
                                awsS3Service.deleteImageFromS3(imageUrl);
                                deletedImageCount++;
                                log.info("S3 이미지 삭제 성공: {}", imageUrl);
                            } catch (Exception e) {
                                log.error("S3 이미지 삭제 실패: {}, error: {}", imageUrl, e.getMessage());
                                // S3 삭제 실패해도 계속 진행 (이미지가 이미 삭제되었을 수 있음)
                            }
                        }
                    }
                }
            }

            log.info("사용자 일기 이미지 S3 삭제 완료 - userIdx: {}, 일기 수: {}, 삭제된 이미지 수: {}",
                    userIdx, userDiaries.size(), deletedImageCount);

        } catch (Exception e) {
            log.error("사용자 일기 이미지 S3 삭제 실패 - userIdx: {}, error: {}", userIdx, e.getMessage(), e);
            // S3 삭제 실패해도 DB 삭제는 계속 진행
        }
    }

}