package com.astro.mood.service.diary;

import com.astro.mood.data.entity.diary.Diary;
import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.data.repository.diary.DiaryRepository;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;

import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.s3Image.AwsS3Service;
import com.astro.mood.service.location.TimezoneService;

import com.astro.mood.service.challenge.ChallengeProgressService;
import com.astro.mood.utils.EncryptionUtils;
import com.astro.mood.web.dto.challenge.ChallengeCompletionResult;
import com.astro.mood.web.dto.diary.DiaryCreateRequest;
import com.astro.mood.web.dto.diary.DiaryResponse;
import com.astro.mood.web.dto.diary.DiaryUpdateRequest;
import com.astro.mood.web.dto.diary.DiaryTrashResponse;
import com.astro.mood.web.dto.diary.DiaryCalendarResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.HashSet;
import java.util.Set;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final AuthRepository authRepository;
    private final ChallengeParticipationRepository challengeParticipationRepository;
    private final AwsS3Service awsS3Service;
    private final ChallengeProgressService challengeProgressService;
    private final EncryptionUtils encryptionUtils;
    private final TimezoneService timezoneService;

    // 사용자 인증 -> 공통로직을 뺌.
    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Integer userIdx = userDetails.getUserIdx();

        return authRepository.findById(userIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * 다이어리 내용을 GCM 방식으로 암호화하여 저장합니다.
     */
    private void encryptDiaryContent(Diary diary) {
        if (diary.getContent() != null && !diary.getContent().isEmpty()) {
            String originalContent = diary.getContent();

            // GCM 방식으로 암호화 (AAD 포함)
            EncryptionUtils.GCMEncryptionResult result = encryptionUtils.encryptGCM(
                    diary.getContent(),
                    diary.getUser().getUserIdx());

            // 암호화된 데이터와 IV 저장 (ciphertext||tag)
            diary.setContent(result.getEncryptedData());
            diary.setIv(result.getIv());

            log.info("다이어리 내용 GCM 암호화 완료: diaryIdx={}, originalLength={}, encryptedLength={}",
                    diary.getDiaryIdx(), originalContent.length(), result.getEncryptedData().length());
        }
    }

    /**
     * 다이어리 내용을 복호화하여 반환합니다.
     * GCM 방식만 지원 (새로운 일기만)
     */
    private String decryptDiaryContent(Diary diary) {
        if (diary.getContent() == null || diary.getContent().isEmpty()) {
            return diary.getContent();
        }

        // GCM 방식 복호화 (iv가 있는 경우만)
        if (diary.getIv() != null && !diary.getIv().isEmpty()) {
            try {
                String decryptedContent = encryptionUtils.decryptGCM(
                        diary.getContent(),
                        diary.getIv(),
                        diary.getUser().getUserIdx(),
                        diary.getDiaryIdx());
                log.info("다이어리 내용 GCM 복호화 완료: diaryIdx={}, encryptedLength={}, decryptedLength={}",
                        diary.getDiaryIdx(), diary.getContent().length(), decryptedContent.length());
                return decryptedContent;
            } catch (Exception e) {
                log.error("GCM 복호화 실패: diaryIdx={}, error={}", diary.getDiaryIdx(), e.getMessage());
                throw new RuntimeException("일기 복호화 실패", e);
            }
        }
        // 기존 테스트 일기는 그대로 반환 (복호화하지 않음)
        else {
            log.info("기존 테스트 일기 (복호화하지 않음): diaryIdx={}", diary.getDiaryIdx());
            return diary.getContent();
        }
    }

    /**
     * 챌린지 참여 정보 조회
     */
    private Integer findChallengeParticipationIdx(User user, Integer challengeIdx) {
        if (challengeIdx == null) {
            return null;
        }

        try {
            List<ChallengeParticipation> userParticipations = challengeParticipationRepository
                    .findByUserAndStatusIn(user, List.of("ACTIVE", "PENDING"));

            Optional<ChallengeParticipation> matchingParticipation = userParticipations.stream()
                    .filter(p -> challengeIdx.equals(p.getChallenge().getChallengeIdx()))
                    .findFirst();

            if (matchingParticipation.isPresent()) {
                Integer participationIdx = matchingParticipation.get().getParticipationIdx();
                log.info("챌린지 연동 성공: challengeIdx={}, participationIdx={}", challengeIdx, participationIdx);
                return participationIdx;
            } else {
                log.warn("챌린지 연동 실패: challengeIdx={}, 사용자가 참여 중이지 않음", challengeIdx);
                return null;
            }
        } catch (Exception e) {
            log.warn("챌린지 연동 중 오류 발생: challengeIdx={}", challengeIdx, e);
            return null;
        }
    }

    // 일기쓰기
    @Transactional
    public DiaryResponse createDiary(DiaryCreateRequest request) {
        // 사용자 인증
        User user = getAuthenticatedUser();
        List<String> uploadedImageUrls = new ArrayList<>();

        // 챌린지 참여 정보 찾기
        Integer challengeParticipationIdx = findChallengeParticipationIdx(user, request.getChallengeIdx());

        // 이미지 업로드 처리
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            try {
                for (MultipartFile image : request.getImages()) {
                    if (image != null && !image.isEmpty()) {
                        // 다이어리 이미지는 구조화된 경로로 업로드: diary/{userId}/{yyyy}/{MM}/{uuid}.{ext}
                        String s3Key = awsS3Service.uploadDiaryImage(image, user.getUserIdx());
                        uploadedImageUrls.add(s3Key);
                    }
                }
            } catch (Exception e) {
                throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR);
            }
        }

        // 타임존 결정: ChallengeParticipation의 timezone 사용 (TRAVEL 로그의 경우)
        // 다양한 나라 이동을 배제한 트래블로그를 먼저 구현하므로, 항상 ChallengeParticipation의 타임존 사용
        String calculatedTimezone = null;
        if (challengeParticipationIdx != null) {
            try {
                Optional<ChallengeParticipation> participationOpt = challengeParticipationRepository
                        .findById(challengeParticipationIdx);
                if (participationOpt.isPresent()) {
                    ChallengeParticipation participation = participationOpt.get();
                    if (participation.getTimezone() != null && !participation.getTimezone().trim().isEmpty()) {
                        calculatedTimezone = participation.getTimezone();
                    }
                }
            } catch (Exception e) {
                // 타임존 조회 실패 시 무시 (서버 시간 사용)
            }
        }

        // Diary 엔티티 생성
        // createdAt은 @PrePersist 콜백에서 타임존 기반으로 자동 설정됨
        Diary diary = Diary.builder()
                .content(request.getContent())
                .emotionIdx(request.getEmotionIdx())
                .imageUrls(new HashSet<>(uploadedImageUrls))
                .user(user)
                .challengeParticipationIdx(challengeParticipationIdx)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .locationName(request.getLocationName())
                .address(request.getAddress())
                .timezone(calculatedTimezone)
                .build();

        // 다이어리 내용 암호화
        encryptDiaryContent(diary);

        // 암호화된 내용으로 저장
        Diary savedDiary = diaryRepository.save(diary);

        // JPA 변경사항을 즉시 DB에 반영
        diaryRepository.flush();

        log.info("DB 저장 완료: diaryIdx={}, contentLength={}",
                savedDiary.getDiaryIdx(), savedDiary.getContent() != null ? savedDiary.getContent().length() : 0);

        // 챌린지 진행도 업데이트 (챌린지와 연결된 일기인 경우)
        if (challengeParticipationIdx != null) {
            try {
                ChallengeCompletionResult completionResult = challengeProgressService
                        .updateProgressOnDiaryWrite(savedDiary);
                log.info("챌린지 진행도 업데이트 완료: diaryIdx={}, participationIdx={}, isCompleted={}",
                        savedDiary.getDiaryIdx(), challengeParticipationIdx, completionResult.isCompleted());

                // 챌린지 완료 시 로그 출력
                if (completionResult.isCompleted()) {
                    log.info("🎉 챌린지 성공! {}", completionResult.getMessage());
                }
            } catch (Exception e) {
                log.warn("챌린지 진행도 업데이트 실패: diaryIdx={}", savedDiary.getDiaryIdx(), e);
            }
        }

        // 복호화된 내용으로 응답 생성 (엔티티는 건드리지 않음)
        String decryptedContent = decryptDiaryContent(savedDiary);
        DiaryResponse response = DiaryResponse.fromEntity(savedDiary);
        // response에만 복호화된 내용 설정
        response.setContent(decryptedContent);

        // 프리사인드 URL 생성
        response.setImageUrls(generatePresignedUrlsForDiary(savedDiary));

        // 챌린지 정보 설정
        if (savedDiary.getChallengeParticipationIdx() != null) {
            try {
                ChallengeParticipation participation = challengeProgressService
                        .getParticipationById(savedDiary.getChallengeParticipationIdx());
                if (participation != null && participation.getChallenge() != null) {
                    response.setChallengeIdx(participation.getChallenge().getChallengeIdx());
                }
            } catch (Exception e) {
                log.warn("일기 작성 시 챌린지 정보 조회 실패: participationIdx={}",
                        savedDiary.getChallengeParticipationIdx(), e);
            }
        }

        return response;
    }

    // 사용자 일기 조회 (달력 형식) - 같은 날짜의 여러 일기 중 가장 최근 감정을 보여줌
    @Transactional(readOnly = true)
    public List<DiaryCalendarResponse> getDiaryCalendar(Integer year, Integer month) {
        User user = getAuthenticatedUser();

        // 월별 일기 조회
        List<Diary> diaries = diaryRepository.findByUserAndMonthWithImages(user, year, month);

        log.info("일기 조회: userIdx={}, year={}, month={}, found={}개",
                user.getUserIdx(), year, month, diaries.size());

        // 날짜별로 그룹화하고, 각 날짜에서 가장 최근 일기의 감정을 사용
        Map<LocalDate, Diary> dateToLatestDiary = new LinkedHashMap<>();
        for (Diary diary : diaries) {
            LocalDate date = diary.getCreatedAt().toLocalDate();
            Diary existingDiary = dateToLatestDiary.get(date);

            // 기존 일기가 없거나, 현재 일기가 더 최근이면 교체
            if (existingDiary == null || diary.getCreatedAt().isAfter(existingDiary.getCreatedAt())) {
                dateToLatestDiary.put(date, diary);
            }
        }

        return dateToLatestDiary.values().stream()
                .map(diary -> {
                    log.info("달력용 일기: diaryIdx={}, date={}, emotionIdx={}",
                            diary.getDiaryIdx(), diary.getCreatedAt().toLocalDate(), diary.getEmotionIdx());

                    return new DiaryCalendarResponse(
                            diary.getDiaryIdx(),
                            diary.getCreatedAt().toLocalDate(),
                            diary.getEmotionIdx());
                })
                .collect(Collectors.toList());
    }

    // 감정비트맵용 1년치 일기 데이터 조회 (성능 최적화)
    @Transactional(readOnly = true)
    public List<DiaryCalendarResponse> getDiaryYear(Integer year) {
        User user = getAuthenticatedUser();

        // 1년치 일기 조회 (이미지 없이 감정 정보만)
        List<Diary> diaries = diaryRepository.findByUserAndYearForEmotionBitmap(user, year);

        log.info("감정비트맵용 1년치 일기 조회: userIdx={}, year={}, found={}개",
                user.getUserIdx(), year, diaries.size());

        // 날짜별로 그룹화하고, 각 날짜에서 가장 최근 일기의 감정을 사용
        Map<LocalDate, Diary> dateToLatestDiary = new LinkedHashMap<>();
        for (Diary diary : diaries) {
            LocalDate date = diary.getCreatedAt().toLocalDate();
            Diary existingDiary = dateToLatestDiary.get(date);

            // 기존 일기가 없거나, 현재 일기가 더 최근이면 교체
            if (existingDiary == null || diary.getCreatedAt().isAfter(existingDiary.getCreatedAt())) {
                dateToLatestDiary.put(date, diary);
            }
        }

        return dateToLatestDiary.values().stream()
                .map(diary -> new DiaryCalendarResponse(
                        diary.getDiaryIdx(),
                        diary.getCreatedAt().toLocalDate(),
                        diary.getEmotionIdx()))
                .collect(Collectors.toList());
    }

    // 일기상세보기
    @Transactional(readOnly = true)
    public DiaryResponse getDiaryByIdx(Integer diaryIdx) {
        Diary diary = diaryRepository.findActiveByIdWithImages(diaryIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        // 복호화된 내용으로 응답 생성 (엔티티는 건드리지 않음)
        String decryptedContent = decryptDiaryContent(diary);
        DiaryResponse response = DiaryResponse.fromEntity(diary);
        // response에만 복호화된 내용 설정
        response.setContent(decryptedContent);

        // 프리사인드 URL 생성
        response.setImageUrls(generatePresignedUrlsForDiary(diary));

        log.info("일기 상세 조회: diaryIdx={}, challengeParticipationIdx={}",
                diary.getDiaryIdx(), diary.getChallengeParticipationIdx());

        // 챌린지 정보 설정
        if (diary.getChallengeParticipationIdx() != null) {
            try {
                ChallengeParticipation participation = challengeProgressService
                        .getParticipationById(diary.getChallengeParticipationIdx());
                if (participation != null && participation.getChallenge() != null) {
                    response.setChallengeIdx(participation.getChallenge().getChallengeIdx());
                    log.info("일기 상세 조회 - 챌린지 정보 설정: diaryIdx={}, challengeIdx={}",
                            diary.getDiaryIdx(), participation.getChallenge().getChallengeIdx());
                } else {
                    log.warn("일기 상세 조회 - 챌린지 참여 정보 없음: participationIdx={}",
                            diary.getChallengeParticipationIdx());
                }
            } catch (Exception e) {
                log.warn("일기 상세 조회 시 챌린지 정보 조회 실패: participationIdx={}",
                        diary.getChallengeParticipationIdx(), e);
            }
        } else {
            log.info("일기 상세 조회 - 챌린지 미연동: diaryIdx={}", diary.getDiaryIdx());
        }

        log.info("일기 상세 조회 응답: diaryIdx={}, challengeIdx={}",
                response.getDiaryIdx(), response.getChallengeIdx());

        return response;
    }

    // 특정 날짜의 모든 일기 조회 (상세보기용)
    @Transactional(readOnly = true)
    public List<DiaryResponse> getDiariesByDate(LocalDate date) {
        User user = getAuthenticatedUser();

        // 해당 날짜의 모든 일기 조회 (시간순 정렬)
        List<Diary> diaries = diaryRepository.findByUserAndDateOrderByCreatedAtAsc(user, date);

        log.info("날짜별 일기 조회: userIdx={}, date={}, found={}개",
                user.getUserIdx(), date, diaries.size());

        return diaries.stream()
                .map(diary -> {
                    String decryptedContent = decryptDiaryContent(diary);
                    DiaryResponse response = DiaryResponse.fromEntity(diary);
                    // response에만 복호화된 내용 설정
                    response.setContent(decryptedContent);
                    // 프리사인드 URL 생성
                    response.setImageUrls(generatePresignedUrlsForDiary(diary));
                    return response;
                })
                .collect(Collectors.toList());
    }

    // 일기 소프트 삭제 (휴지통으로)
    @Transactional
    public void softDeleteDiary(Integer diaryIdx) {
        User user = getAuthenticatedUser();
        Diary diary = diaryRepository.findActiveById(diaryIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        // 사용자 권한 확인
        if (!diary.getUser().getUserIdx().equals(user.getUserIdx())) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 챌린지 진행도 감소 처리
        updateChallengeProgress(diary, ProgressOperationType.DECREASE, "일기 삭제");

        diary.setDeletedAt(java.time.LocalDateTime.now());
        diaryRepository.save(diary);

        log.info("일기가 휴지통으로 이동되었습니다: diaryIdx={}", diaryIdx);
    }

    // 휴지통 일기 목록 조회
    @Transactional(readOnly = true)
    public List<DiaryTrashResponse> getTrashDiaries() {
        User user = getAuthenticatedUser();
        List<Diary> deletedDiaries = diaryRepository.findDeletedDiariesByUserWithImages(user);

        return deletedDiaries.stream()
                .map(diary -> {
                    String decryptedContent = decryptDiaryContent(diary);
                    DiaryTrashResponse response = DiaryTrashResponse.fromEntity(diary);
                    // response에만 복호화된 내용 설정
                    response.setContent(decryptedContent);
                    return response;
                })
                .collect(Collectors.toList());
    }

    // 일기 복원
    @Transactional
    public void restoreDiary(Integer diaryIdx) {
        User user = getAuthenticatedUser();
        Diary diary = diaryRepository.findById(diaryIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        // 사용자 권한 확인
        if (!diary.getUser().getUserIdx().equals(user.getUserIdx())) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 이미 복원된 일기인지 확인
        if (diary.getDeletedAt() == null) {
            throw new CustomException(ErrorCode.DIARY_ALREADY_RESTORED);
        }

        // 챌린지 진행도 증가 처리
        updateChallengeProgress(diary, ProgressOperationType.INCREASE, "일기 복원");

        diary.setDeletedAt(null);
        diaryRepository.save(diary);

        log.info("일기가 복원되었습니다: diaryIdx={}", diaryIdx);
    }

    // 일기 영구 삭제
    @Transactional
    public void permanentDeleteDiary(Integer diaryIdx) {
        User user = getAuthenticatedUser();
        Diary diary = diaryRepository.findById(diaryIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        // 사용자 권한 확인
        if (!diary.getUser().getUserIdx().equals(user.getUserIdx())) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 휴지통에 있는 일기인지 확인
        if (diary.getDeletedAt() == null) {
            throw new CustomException(ErrorCode.DIARY_NOT_IN_TRASH);
        }

        // 이미지가 있다면 S3에서도 삭제
        if (diary.getImageUrls() != null && !diary.getImageUrls().isEmpty()) {
            for (String url : diary.getImageUrls()) {
                if (url != null && !url.isEmpty()) {
                    try {
                        awsS3Service.deleteImageFromS3(url);
                    } catch (Exception e) {
                        log.error("Failed to delete image from S3: {}", url, e);
                    }
                }
            }
        }

        // 일기 완전 삭제
        diaryRepository.delete(diary);

        log.info("일기가 영구 삭제되었습니다: diaryIdx={}", diaryIdx);
    }

    // 30일 지난 휴지통 일기 자동 삭제 (스케줄러용)
    @Transactional
    public int cleanupExpiredTrashDiaries() {
        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);
        List<Diary> expiredDiaries = diaryRepository.findDiariesForPermanentDeletion(thirtyDaysAgo);

        int deletedCount = 0;
        for (Diary diary : expiredDiaries) {
            try {
                // 이미지 삭제
                if (diary.getImageUrls() != null && !diary.getImageUrls().isEmpty()) {
                    for (String url : diary.getImageUrls()) {
                        if (url != null && !url.isEmpty()) {
                            awsS3Service.deleteImageFromS3(url);
                        }
                    }
                }

                // 일기 삭제
                diaryRepository.delete(diary);
                deletedCount++;

                log.info("30일 지난 일기 자동 삭제: diaryIdx={}", diary.getDiaryIdx());
            } catch (Exception e) {
                log.error("자동 삭제 실패: diaryIdx={}", diary.getDiaryIdx(), e);
            }
        }

        log.info("총 {}개의 만료된 일기가 자동 삭제되었습니다", deletedCount);
        return deletedCount;
    }

    // 일기 수정
    @Transactional
    public DiaryResponse updateDiary(Integer diaryId, DiaryUpdateRequest updateRequest) {
        log.debug("일기 수정 시작 - diaryId: {}", diaryId);

        User user = getAuthenticatedUser();
        Diary diary = diaryRepository.findActiveById(diaryId)
                .orElseThrow(() -> new CustomException(ErrorCode.DIARY_NOT_FOUND));

        // 사용자 권한 확인
        if (!diary.getUser().getUserIdx().equals(user.getUserIdx())) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        // 챌린지 참여 정보 찾기 (일기 수정 시에는 모든 상태의 챌린지 포함)
        Integer challengeParticipationIdx = null;
        if (updateRequest.getChallengeIdx() != null) {
            try {
                // 일기 수정 시에는 모든 상태의 챌린지 참여 정보를 찾음
                List<ChallengeParticipation> userParticipations = challengeParticipationRepository
                        .findByUserAndStatusIn(user, List.of("ACTIVE", "PENDING", "COMPLETED", "FAILED"));

                Optional<ChallengeParticipation> matchingParticipation = userParticipations.stream()
                        .filter(p -> updateRequest.getChallengeIdx().equals(p.getChallenge().getChallengeIdx()))
                        .findFirst();

                if (matchingParticipation.isPresent()) {
                    challengeParticipationIdx = matchingParticipation.get().getParticipationIdx();
                    log.info("일기 수정 - 챌린지 연동 성공: challengeIdx={}, participationIdx={}, status={}",
                            updateRequest.getChallengeIdx(), challengeParticipationIdx,
                            matchingParticipation.get().getStatus());
                } else {
                    log.warn("일기 수정 - 챌린지 연동 실패: challengeIdx={}, 사용자가 참여한 적이 없음", updateRequest.getChallengeIdx());
                }
            } catch (Exception e) {
                log.error("일기 수정 - 챌린지 연동 중 오류 발생: challengeIdx={}", updateRequest.getChallengeIdx(), e);
            }
        }

        // 현재 이미지 URL 목록 가져오기
        Set<String> currentImageUrls = new HashSet<>();
        if (diary.getImageUrls() != null) {
            currentImageUrls.addAll(diary.getImageUrls());
        }
        // 삭제할 이미지 처리
        if (updateRequest.getRemovedImageUrls() != null && !updateRequest.getRemovedImageUrls().isEmpty()) {
            log.info("일기 수정 - 삭제할 이미지 처리 시작: 개수={}", updateRequest.getRemovedImageUrls().size());
            for (String removedUrl : updateRequest.getRemovedImageUrls()) {
                try {
                    // 프리사인드 URL에서 S3 키 추출
                    String extractedKey = awsS3Service.extractKeyFromUrlOrKey(removedUrl);
                    log.info("일기 수정 - 프리사인드 URL에서 키 추출: removedUrl={}, extractedKey={}",
                            removedUrl, extractedKey);

                    // 추출한 키로 DB의 currentImageUrls와 매칭
                    String keyToRemove = null;
                    for (String currentKey : currentImageUrls) {
                        // 버킷 이름이 포함되어 있을 수 있으므로 정규화
                        String normalizedCurrentKey = awsS3Service.extractKeyFromUrlOrKey(currentKey);
                        if (extractedKey.equals(normalizedCurrentKey) || extractedKey.equals(currentKey)) {
                            keyToRemove = currentKey;
                            break;
                        }
                    }

                    if (keyToRemove != null) {
                        // DB의 키로 삭제 (정확한 키 사용)
                        awsS3Service.deleteImageFromS3(keyToRemove);
                        currentImageUrls.remove(keyToRemove);
                        log.info("일기 수정 - 이미지 삭제 완료: keyToRemove={}", keyToRemove);
                    } else {
                        // 매칭되지 않아도 추출한 키로 직접 삭제 시도 (프리사인드 URL에서 추출한 키)
                        log.warn("일기 수정 - DB에서 매칭 실패, 추출한 키로 직접 삭제 시도: extractedKey={}", extractedKey);
                        try {
                            awsS3Service.deleteImageFromS3(extractedKey);
                            // DB에서도 제거 시도 (키로 매칭)
                            currentImageUrls.removeIf(key -> {
                                String normalizedKey = awsS3Service.extractKeyFromUrlOrKey(key);
                                return extractedKey.equals(normalizedKey) || extractedKey.equals(key);
                            });
                            log.info("일기 수정 - 직접 삭제 성공: extractedKey={}", extractedKey);
                        } catch (Exception deleteException) {
                            log.error("일기 수정 - 직접 삭제도 실패: extractedKey={}, error={}",
                                    extractedKey, deleteException.getMessage());
                        }
                    }
                } catch (Exception e) {
                    log.error("일기 수정 - 이미지 삭제 처리 중 예외: removedUrl={}, error={}",
                            removedUrl, e.getMessage(), e);
                }
            }
            log.info("일기 수정 - 삭제할 이미지 처리 완료: 최종 이미지 개수={}", currentImageUrls.size());
        }

        // 새로운 이미지 업로드
        if (updateRequest.getImages() != null && !updateRequest.getImages().isEmpty()) {
            for (MultipartFile image : updateRequest.getImages()) {
                if (image != null && !image.isEmpty()) {
                    try {
                        // 다이어리 이미지는 구조화된 경로로 업로드: diary/{userId}/{yyyy}/{MM}/{uuid}.{ext}
                        String imageUrl = awsS3Service.uploadDiaryImage(image, user.getUserIdx());
                        currentImageUrls.add(imageUrl);
                        log.debug("이미지 업로드 완료: {}", imageUrl);
                    } catch (Exception e) {
                        log.error("Error uploading new image", e);
                        throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR);
                    }
                }
            }
        }

        // 이전 챌린지 참여 ID 저장 (진행도 업데이트용)
        Integer previousChallengeParticipationIdx = diary.getChallengeParticipationIdx();

        // 타임존 결정: ChallengeParticipation의 timezone 사용 (TRAVEL 로그의 경우)
        // 일기 생성과 동일한 로직 적용
        String calculatedTimezone = null;
        if (challengeParticipationIdx != null) {
            try {
                Optional<ChallengeParticipation> participationOpt = challengeParticipationRepository
                        .findById(challengeParticipationIdx);
                if (participationOpt.isPresent()) {
                    ChallengeParticipation participation = participationOpt.get();
                    if (participation.getTimezone() != null && !participation.getTimezone().trim().isEmpty()) {
                        calculatedTimezone = participation.getTimezone();
                        log.info("📍 일기 수정 시 챌린지 타임존 사용: participationIdx={}, timezone={}",
                                challengeParticipationIdx, calculatedTimezone);
                    }
                }
            } catch (Exception e) {
                // 타임존 조회 실패 시 무시 (위치 정보로 계산)
                log.warn("일기 수정 시 챌린지 타임존 조회 실패: participationIdx={}", challengeParticipationIdx, e);
            }
        }

        // 챌린지 타임존이 없고 위치 정보가 있으면 타임존 자동 계산
        if (calculatedTimezone == null && updateRequest.getLatitude() != null && updateRequest.getLongitude() != null) {
            calculatedTimezone = timezoneService.getTimezoneFromCoordinates(
                    updateRequest.getLatitude(), updateRequest.getLongitude());
            log.info("📍 일기 수정 시 위치 정보로 타임존 자동 계산: lat={}, lon={}, timezone={}",
                    updateRequest.getLatitude(), updateRequest.getLongitude(), calculatedTimezone);
        }

        // 일기 내용 업데이트
        diary.setContent(updateRequest.getContent());
        diary.setEmotionIdx(updateRequest.getEmotionIdx());
        diary.setImageUrls(currentImageUrls.isEmpty() ? new HashSet<>() : currentImageUrls);
        diary.setChallengeParticipationIdx(challengeParticipationIdx);
        diary.setLatitude(updateRequest.getLatitude());
        diary.setLongitude(updateRequest.getLongitude());
        diary.setLocationName(updateRequest.getLocationName());
        diary.setAddress(updateRequest.getAddress());

        // 타임존이 변경되면 createdAt을 새로운 타임존 기준으로 변환
        String previousTimezone = diary.getTimezone();
        diary.setTimezone(calculatedTimezone);

        if (calculatedTimezone != null && !calculatedTimezone.trim().isEmpty()
                && (previousTimezone == null || !previousTimezone.equals(calculatedTimezone))) {
            try {
                // 기존 createdAt을 기존 타임존의 ZonedDateTime으로 변환
                LocalDateTime currentCreatedAt = diary.getCreatedAt();
                if (currentCreatedAt != null) {
                    // 기존 타임존이 있으면 그 타임존으로, 없으면 서버 타임존으로 가정
                    ZoneId previousZoneId = (previousTimezone != null && !previousTimezone.trim().isEmpty())
                            ? ZoneId.of(previousTimezone)
                            : ZoneId.systemDefault();

                    // 기존 시간을 기존 타임존의 ZonedDateTime으로 변환
                    ZonedDateTime zonedDateTime = currentCreatedAt.atZone(previousZoneId);

                    // 새로운 타임존으로 변환
                    ZonedDateTime newZonedDateTime = zonedDateTime.withZoneSameInstant(ZoneId.of(calculatedTimezone));

                    // LocalDateTime으로 변환하여 저장
                    LocalDateTime newCreatedAt = newZonedDateTime.toLocalDateTime();
                    diary.setCreatedAt(newCreatedAt);

                    log.info(
                            "📍 일기 수정 시 타임존 변경으로 createdAt 변환: previousTimezone={}, newTimezone={}, previousCreatedAt={}, newCreatedAt={}",
                            previousTimezone, calculatedTimezone, currentCreatedAt, newCreatedAt);
                }
            } catch (Exception e) {
                log.error("일기 수정 시 타임존 변환 실패: previousTimezone={}, newTimezone={}",
                        previousTimezone, calculatedTimezone, e);
                // 타임존 변환 실패 시 기존 시간 유지
            }
        }

        // 다이어리 내용 암호화
        encryptDiaryContent(diary);

        Diary savedDiary = diaryRepository.save(diary);
        log.info("일기가 수정되었습니다: diaryIdx={}", diaryId);

        // 챌린지 진행도 업데이트
        try {
            // 이전 챌린지와 현재 챌린지가 다른 경우에만 진행도 업데이트
            if (!java.util.Objects.equals(previousChallengeParticipationIdx, challengeParticipationIdx)) {
                log.info("일기 수정 시 챌린지 변경 감지: previousParticipationIdx={}, currentParticipationIdx={}",
                        previousChallengeParticipationIdx, challengeParticipationIdx);

                // 1. 이전 챌린지가 있었다면 해당 챌린지의 진행도에서 제거
                if (previousChallengeParticipationIdx != null) {
                    updateChallengeProgress(savedDiary, previousChallengeParticipationIdx,
                            ProgressOperationType.DECREASE, "이전 챌린지 진행도 제거");
                }

                // 2. 현재 챌린지가 있다면 진행도 업데이트 (중복 체크 포함)
                if (challengeParticipationIdx != null) {
                    ChallengeCompletionResult completionResult = challengeProgressService
                            .updateProgressOnDiaryUpdateForNewChallenge(savedDiary);
                    log.info("일기 수정 시 챌린지 진행도 업데이트 완료: diaryIdx={}, currentParticipationIdx={}, isCompleted={}",
                            savedDiary.getDiaryIdx(), challengeParticipationIdx, completionResult.isCompleted());

                    // 챌린지 완료 시 로그 출력
                    if (completionResult.isCompleted()) {
                        log.info("🎉 챌린지 성공! {}", completionResult.getMessage());
                    }
                }
            } else {
                log.info("일기 수정 시 챌린지 변경 없음: participationIdx={}", challengeParticipationIdx);
            }
        } catch (Exception e) {
            log.warn("일기 수정 시 챌린지 진행도 업데이트 실패: diaryIdx={}", savedDiary.getDiaryIdx(), e);
        }

        // 복호화된 내용으로 응답 생성 (엔티티는 건드리지 않음)
        String decryptedContent = decryptDiaryContent(savedDiary);
        DiaryResponse response = DiaryResponse.fromEntity(savedDiary);
        // response에만 복호화된 내용 설정
        response.setContent(decryptedContent);

        // 프리사인드 URL 생성
        response.setImageUrls(generatePresignedUrlsForDiary(savedDiary));

        // 챌린지 정보 설정
        if (savedDiary.getChallengeParticipationIdx() != null) {
            try {
                ChallengeParticipation participation = challengeProgressService
                        .getParticipationById(savedDiary.getChallengeParticipationIdx());
                if (participation != null && participation.getChallenge() != null) {
                    response.setChallengeIdx(participation.getChallenge().getChallengeIdx());
                }
            } catch (Exception e) {
                log.warn("일기 수정 시 챌린지 정보 조회 실패: participationIdx={}",
                        savedDiary.getChallengeParticipationIdx(), e);
            }
        }

        return response;
    }

    // 일기 총 개수 가져오기
    @Transactional(readOnly = true)
    public int getCountDiaryByUserIdx(Integer loginIdx) {
        return diaryRepository.countByUserUserIdx(loginIdx);
    }

    // 매일 자정에 30일 지난 휴지통 일기 자동 삭제
    @Scheduled(cron = "0 0 0 * * *") // 매일 자정 실행
    @Transactional
    public void scheduledCleanupExpiredTrashDiaries() {
        try {
            int deletedCount = cleanupExpiredTrashDiaries();
            if (deletedCount > 0) {
                log.info("스케줄러: {}개의 만료된 일기가 자동 삭제되었습니다", deletedCount);
            }
        } catch (Exception e) {
            log.error("스케줄러: 만료된 일기 자동 삭제 중 오류 발생", e);
        }
    }

    /**
     * 사용자의 첫 번째 일기 작성일을 조회
     */
    public LocalDate getFirstRecordDate(Integer loginIdx) {
        log.info("사용자 {} 첫 기록일 조회 시작", loginIdx);
        LocalDate firstDate = diaryRepository.findFirstRecordDateByUser(loginIdx);
        log.info("사용자 {} 첫 기록일 조회 결과: {}", loginIdx, firstDate);
        return firstDate;
    }

    /**
     * 사용자의 연속 일기 작성 일수를 계산
     */
    public Integer getConsecutiveDays(Integer loginIdx) {
        log.info("사용자 {} 연속 기록 일수 계산 시작", loginIdx);

        try {
            // 간단한 방법: 오늘부터 30일 전까지 확인
            LocalDate today = LocalDate.now();
            int consecutiveDays = 0;

            for (int i = 0; i < 30; i++) {
                LocalDate checkDate = today.minusDays(i);
                Long count = diaryRepository.countByUserLoginIdxAndDate(loginIdx, checkDate);

                if (count > 0) {
                    consecutiveDays++;
                } else {
                    break;
                }
            }

            log.info("사용자 {} 연속 기록 일수 계산 결과: {}일", loginIdx, consecutiveDays);
            return consecutiveDays;
        } catch (Exception e) {
            log.error("연속 일수 계산 중 에러 발생: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 챌린지 진행도 변경 처리 (공통 로직)
     * 
     * @param diary            일기 엔티티
     * @param operationType    진행도 변경 타입 (DECREASE: 감소, INCREASE: 증가)
     * @param operationContext 작업 컨텍스트 (삭제, 복원, 수정 등)
     */
    private void updateChallengeProgress(Diary diary, ProgressOperationType operationType, String operationContext) {
        updateChallengeProgress(diary, diary.getChallengeParticipationIdx(), operationType, operationContext);
    }

    /**
     * 챌린지 진행도 변경 처리 (공통 로직) - 오버로드
     * 
     * @param diary                     일기 엔티티
     * @param challengeParticipationIdx 챌린지 참여 ID (diary의 것과 다를 수 있음)
     * @param operationType             진행도 변경 타입 (DECREASE: 감소, INCREASE: 증가)
     * @param operationContext          작업 컨텍스트 (삭제, 복원, 수정 등)
     */
    private void updateChallengeProgress(Diary diary, Integer challengeParticipationIdx,
            ProgressOperationType operationType, String operationContext) {
        if (challengeParticipationIdx == null) {
            return;
        }

        try {
            ChallengeParticipation participation = challengeProgressService
                    .getParticipationById(challengeParticipationIdx);

            if (participation == null || !"ACTIVE".equals(participation.getStatus())) {
                return;
            }

            LocalDate diaryDate = diary.getCreatedAt().toLocalDate();

            // 같은 날짜에 해당 챌린지로 작성된 다른 일기가 있는지 확인 (현재 작업 중인 일기 제외)
            boolean hasSameDateDiary = diaryRepository
                    .existsByChallengeParticipationIdxAndDateExcludingDiary(
                            challengeParticipationIdx, diaryDate, diary.getDiaryIdx());

            if (hasSameDateDiary) {
                log.info("같은 날짜에 해당 챌린지로 작성된 다른 일기가 있어서 진행도 변경하지 않음: participationIdx={}, date={}, operation={}",
                        challengeParticipationIdx, diaryDate, operationContext);
                return;
            }

            // 진행도 변경 처리
            if (operationType == ProgressOperationType.DECREASE) {
                challengeProgressService.decrementProgressWithLastCompletedDateUpdate(participation, diaryDate);
                log.info("{} 시 챌린지 진행도 감소: participationIdx={}, date={}, newProgressDays={}, newLastCompletedDate={}",
                        operationContext, challengeParticipationIdx, diaryDate,
                        participation.getProgressDays(), participation.getLastCompletedDate());
            } else if (operationType == ProgressOperationType.INCREASE) {
                ChallengeCompletionResult completionResult = challengeProgressService
                        .updateProgressOnDiaryUpdateForNewChallenge(diary);
                log.info("{} 시 챌린지 진행도 증가: participationIdx={}, date={}, newProgressDays={}, isCompleted={}",
                        operationContext, challengeParticipationIdx, diaryDate,
                        participation.getProgressDays(), completionResult.isCompleted());

                // 챌린지 완료 시 로그 출력
                if (completionResult.isCompleted()) {
                    log.info("🎉 {}으로 챌린지 성공! {}", operationContext, completionResult.getMessage());
                }
            }

        } catch (Exception e) {
            log.warn("{} 시 챌린지 진행도 변경 실패: participationIdx={}", operationContext, challengeParticipationIdx, e);
        }
    }

    /**
     * 진행도 변경 타입 열거형
     */
    private enum ProgressOperationType {
        DECREASE, INCREASE
    }

    /**
     * 사용자의 총 일기 수를 조회
     */
    public Long getTotalDiariesCount(Integer loginIdx) {
        log.info("사용자 {} 총 일기 수 조회 시작", loginIdx);
        Long totalCount = diaryRepository.countByUserLoginIdxAndIsDeletedFalse(loginIdx);
        log.info("사용자 {} 총 일기 수 조회 결과: {}", loginIdx, totalCount);
        return totalCount;
    }

    // 모든 이미지 URL 추출 (ACL 수정용)
    @Transactional(readOnly = true)
    public List<String> getAllImageUrls() {
        User user = getAuthenticatedUser();
        List<Diary> diaries = diaryRepository.findByUserIdx(user.getUserIdx());

        List<String> allImageUrls = new ArrayList<>();
        for (Diary diary : diaries) {
            if (diary.getImageUrls() != null) {
                allImageUrls.addAll(diary.getImageUrls());
            }
        }

        log.info("사용자 {}의 총 이미지 URL {}개 추출", user.getUserIdx(), allImageUrls.size());
        return allImageUrls;
    }

    /**
     * 일기의 이미지 URL들을 프리사인드 URL로 변환한다.
     * 
     * @param diary 일기 엔티티
     * @return 프리사인드 URL 목록
     */
    private List<String> generatePresignedUrlsForDiary(Diary diary) {
        if (diary.getImageUrls() == null || diary.getImageUrls().isEmpty()) {
            return new ArrayList<>();
        }

        List<String> imageKeys = new ArrayList<>(diary.getImageUrls());
        return awsS3Service.generatePresignedUrls(imageKeys);
    }
}
