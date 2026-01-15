package com.astro.mood.web.controller.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.entity.diary.Diary;
import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.repository.challenge.ChallengeRepository;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.data.repository.diary.DiaryRepository;

import com.astro.mood.web.dto.challenge.ChallengeDto;
import com.astro.mood.web.dto.diary.DiaryResponse;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.utils.EncryptionUtils;
import com.astro.mood.service.s3Image.AwsS3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@Slf4j
@RestController
@RequestMapping("/api/challenge")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeRepository challengeRepository;
    private final ChallengeParticipationRepository participationRepository;
    private final AuthRepository authRepository;
    private final DiaryRepository diaryRepository;
    private final EncryptionUtils encryptionUtils;
    private final AwsS3Service awsS3Service;

    /**
     * 챌린지 목록 조회 (전체 챌린지)
     * 
     * @param userDetails 인증된 사용자 정보(참여 여부 표시용, null 가능)
     * @return 챌린지 목록 + 참여여부
     */
    @GetMapping
    public ResponseEntity<List<ChallengeDto.ListResponse>> getChallenges(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<Challenge> challenges = challengeRepository.findByIsActiveOrderByCreatedAtDesc(true);

            // 사용자 참여 상태와 진행률을 한 번에 조회 (성능 최적화)
            Map<Integer, Boolean> participationMap = new HashMap<>();
            Map<Integer, ChallengeParticipation> participationDataMap = new HashMap<>();
            if (userDetails != null) {
                User user = authRepository.findById(userDetails.getUserIdx()).orElse(null);
                if (user != null) {
                    List<ChallengeParticipation> participations = participationRepository.findByUserAndStatusIn(user,
                            Arrays.asList("PENDING", "ACTIVE", "COMPLETED"));

                    // ACTIVE 상태인 챌린지만 isJoined = true로 설정
                    participationMap = participations.stream()
                            .filter(p -> "ACTIVE".equals(p.getStatus()))
                            .collect(Collectors.toMap(
                                    p -> p.getChallenge().getChallengeIdx(),
                                    p -> true));

                    participationDataMap = participations.stream()
                            .collect(Collectors.toMap(
                                    p -> p.getChallenge().getChallengeIdx(),
                                    p -> p,
                                    (existing, replacement) -> replacement)); // 중복 키 시 최신 값 사용
                }
            }

            // 각 챌린지에 대해 참여 상태와 진행률 설정
            final Map<Integer, Boolean> finalParticipationMap = participationMap;
            final Map<Integer, ChallengeParticipation> finalParticipationDataMap = participationDataMap;
            List<ChallengeDto.ListResponse> responseList = challenges.stream()
                    .map(challenge -> {
                        boolean isParticipating = finalParticipationMap.getOrDefault(
                                challenge.getChallengeIdx(), false);

                        ChallengeParticipation participation = finalParticipationDataMap
                                .get(challenge.getChallengeIdx());
                        Integer progressDays = participation != null ? participation.getProgressDays() : 0;
                        BigDecimal completionRate = participation != null
                                ? BigDecimal.valueOf(participation.getCompletionRate())
                                : BigDecimal.ZERO;

                        ChallengeDto.ListResponse response = ChallengeDto.ListResponse
                                .fromEntityWithParticipationAndProgress(
                                        challenge, isParticipating, progressDays, completionRate);

                        // TRAVEL 로그는 participation의 durationDays 사용, NORMAL 로그는 challenge의 durationDays
                        // 사용
                        if (participation != null && challenge.getType() != null
                                && "TRAVEL".equals(challenge.getType())) {
                            response.setDurationDays(participation.getDurationDays());
                        }

                        log.debug("🔍 Challenge DTO 생성: title={}, type={}, durationDays={}",
                                challenge.getTitle(), response.getType(), response.getDurationDays());
                        return response;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            log.error("챌린지 목록 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 챌린지 상세 조회 (전체 챌린지)
     * 
     * @param challengeIdx 챌린지 식별자
     * @param userDetails  인증된 사용자 정보(참여 여부 표시용, null 가능)
     * @return 챌린지 상세 + 참여여부
     */
    @GetMapping("/{challengeIdx}")
    public ResponseEntity<ChallengeDto.Response> getChallengeDetail(
            @PathVariable Integer challengeIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Challenge challenge = challengeRepository.findById(challengeIdx)
                    .orElseThrow(() -> new IllegalArgumentException("챌린지를 찾을 수 없습니다."));

            // 사용자 참여 여부 확인 (최신 참여 기준)
            boolean isParticipating = false;
            if (userDetails != null) {
                User user = authRepository.findById(userDetails.getUserIdx()).orElse(null);
                if (user != null) {
                    List<ChallengeParticipation> participations = participationRepository
                            .findAllByChallengeAndUserOrderByStartedAtDesc(challenge, user);
                    if (!participations.isEmpty()) {
                        // 최신 참여의 상태를 기준으로 판단 (진행중인 상태만 참여중으로 간주)
                        ChallengeParticipation latestParticipation = participations.get(0);
                        isParticipating = "PENDING".equals(latestParticipation.getStatus()) ||
                                "ACTIVE".equals(latestParticipation.getStatus());
                    }
                }
            }

            ChallengeDto.Response response = ChallengeDto.Response.fromEntityWithParticipation(challenge,
                    isParticipating);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("챌린지 상세 조회 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("챌린지 상세 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 참여 상태 확인 (특정 챌린지에 대한 내 참여 상태)
     * 
     * @param challengeIdx 챌린지 식별자
     * @param userDetails  인증된 사용자 정보
     * @return 참여 상태, 결제 상태 등
     */
    @GetMapping("/{challengeIdx}/status")
    public ResponseEntity<Map<String, Object>> getParticipationStatus(
            @PathVariable Integer challengeIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }

            Challenge challenge = challengeRepository.findById(challengeIdx)
                    .orElseThrow(() -> new IllegalArgumentException("챌린지를 찾을 수 없습니다."));

            User user = authRepository.findById(userDetails.getUserIdx())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            Optional<ChallengeParticipation> participationOpt = participationRepository
                    .findByChallengeAndUser(challenge, user);

            if (participationOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "isParticipating", false,
                        "status", "NOT_PARTICIPATING"));
            }

            ChallengeParticipation participation = participationOpt.get();

            Map<String, Object> response = Map.of(
                    "isParticipating", true,
                    "status", participation.getStatus(),
                    "participationIdx", participation.getParticipationIdx(),
                    "progressDays", participation.getProgressDays(),
                    "isCompleted", participation.getIsCompleted());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("참여 상태 확인 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("참여 상태 확인 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 챌린지 생성
     */
    @PostMapping
    public ResponseEntity<ChallengeDto.Response> createChallenge(
            @RequestBody ChallengeDto.CreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }

            Challenge challenge = Challenge.builder()
                    .title(request.getTitle())
                    .description(request.getDescription())
                    .durationDays(request.getDurationDays())
                    .imageUrl(request.getImageUrl())
                    .isActive(request.getIsActive())
                    .rules(request.getRules())
                    .rewards(request.getRewards())
                    .build();

            Challenge savedChallenge = challengeRepository.save(challenge);
            ChallengeDto.Response response = ChallengeDto.Response.fromEntity(savedChallenge);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("챌린지 생성 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 챌린지 수정
     */
    @PutMapping("/{challengeIdx}")
    public ResponseEntity<ChallengeDto.Response> updateChallenge(
            @PathVariable Integer challengeIdx,
            @RequestBody ChallengeDto.UpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }

            Challenge challenge = challengeRepository.findById(challengeIdx)
                    .orElseThrow(() -> new IllegalArgumentException("챌린지를 찾을 수 없습니다."));

            // 필드 업데이트
            if (request.getTitle() != null)
                challenge.setTitle(request.getTitle());
            if (request.getDescription() != null)
                challenge.setDescription(request.getDescription());
            if (request.getDurationDays() != null)
                challenge.setDurationDays(request.getDurationDays());
            if (request.getImageUrl() != null)
                challenge.setImageUrl(request.getImageUrl());
            if (request.getIsActive() != null)
                challenge.setIsActive(request.getIsActive());
            if (request.getRules() != null)
                challenge.setRules(request.getRules());
            if (request.getRewards() != null)
                challenge.setRewards(request.getRewards());

            Challenge savedChallenge = challengeRepository.save(challenge);
            ChallengeDto.Response response = ChallengeDto.Response.fromEntity(savedChallenge);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("챌린지 수정 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("챌린지 수정 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 챌린지 삭제
     */
    @DeleteMapping("/{challengeIdx}")
    public ResponseEntity<Void> deleteChallenge(
            @PathVariable Integer challengeIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }

            Challenge challenge = challengeRepository.findById(challengeIdx)
                    .orElseThrow(() -> new IllegalArgumentException("챌린지를 찾을 수 없습니다."));

            challengeRepository.delete(challenge);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("챌린지 삭제 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("챌린지 삭제 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 챌린지 참여 기간 동안의 일기 목록 조회
     */
    @GetMapping("/participation/{participationIdx}/diaries")
    @Transactional(readOnly = true)
    public ResponseEntity<List<DiaryResponse>> getDiariesByChallenge(
            @PathVariable Integer participationIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }

            // 1. 해당 챌린지 참여와 연동된 일기 목록 조회 (정확한 연동)
            List<Diary> diaries = diaryRepository.findByChallengeParticipationIdxOrderByCreatedAtDesc(
                    participationIdx);

            // 2. DiaryResponse DTO로 변환 (일반 일기와 동일한 구조)
            List<DiaryResponse> diaryResponses = diaries.stream()
                    .map(diary -> {
                        log.info("챌린지 일기 변환: diaryIdx={}, imageUrls={}",
                                diary.getDiaryIdx(), diary.getImageUrls());

                        // 복호화된 내용으로 응답 생성 (엔티티는 건드리지 않음)
                        String decryptedContent;
                        if (diary.getIv() != null && !diary.getIv().isEmpty()) {
                            // GCM 방식 복호화 (새로운 일기만)
                            decryptedContent = encryptionUtils.decryptGCM(
                                    diary.getContent(),
                                    diary.getIv(),
                                    diary.getUser().getUserIdx(),
                                    diary.getDiaryIdx());
                        } else {
                            // 기존 테스트 일기는 그대로 반환 (복호화하지 않음)
                            decryptedContent = diary.getContent();
                        }

                        DiaryResponse response = DiaryResponse.fromEntity(diary);
                        // response에만 복호화된 내용 설정
                        response.setContent(decryptedContent);

                        // 프리사인드 URL 생성 (일기 상세 API와 동일하게)
                        response.setImageUrls(awsS3Service.generatePresignedUrls(
                                diary.getImageUrls() != null ? new java.util.ArrayList<>(diary.getImageUrls())
                                        : new java.util.ArrayList<>()));

                        // 챌린지 정보 설정 (이미 해당 챌린지의 일기이므로 participationIdx를 통해 challengeIdx 설정)
                        if (diary.getChallengeParticipationIdx() != null) {
                            try {
                                ChallengeParticipation participation = participationRepository
                                        .findById(diary.getChallengeParticipationIdx()).orElse(null);
                                if (participation != null && participation.getChallenge() != null) {
                                    response.setChallengeIdx(participation.getChallenge().getChallengeIdx());
                                }
                            } catch (Exception e) {
                                log.warn("챌린지 일기 변환 시 챌린지 정보 조회 실패: participationIdx={}",
                                        diary.getChallengeParticipationIdx(), e);
                            }
                        }

                        log.info("변환된 일기: diaryIdx={}, imageUrls={}, imageUrlsSize={}, challengeIdx={}",
                                diary.getDiaryIdx(), response.getImageUrls(), response.getImageUrls().size(),
                                response.getChallengeIdx());

                        return response;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(diaryResponses);
        } catch (IllegalArgumentException e) {
            log.error("챌린지 일기 조회 실패: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("챌린지 일기 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 챌린지 참여 신청
     */
    @PostMapping("/{challengeIdx}/join")
    public ResponseEntity<Map<String, Object>> joinChallenge(
            @PathVariable Integer challengeIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).build();
            }

            Challenge challenge = challengeRepository.findById(challengeIdx)
                    .orElseThrow(() -> new IllegalArgumentException("챌린지를 찾을 수 없습니다."));

            User user = authRepository.findById(userDetails.getUserIdx())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

            // 현재 진행 중인 챌린지가 있는지 확인 (ACTIVE 상태만 체크)
            Optional<ChallengeParticipation> activeParticipation = participationRepository
                    .findByChallengeAndUserAndStatus(challenge, user, "ACTIVE");

            if (activeParticipation.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "이미 진행 중인 챌린지입니다."));
            }

            // 챌린지 참여 생성
            ChallengeParticipation participation = ChallengeParticipation.builder()
                    .challenge(challenge)
                    .user(user)
                    .status("ACTIVE")
                    .startedAt(LocalDateTime.now())
                    .progressDays(0)
                    .isCompleted(false)
                    .build();

            // 참여 종료일 설정 (시작일 + 챌린지 기간)
            participation.setEndDate();

            ChallengeParticipation savedParticipation = participationRepository.save(participation);

            Map<String, Object> response = Map.of(
                    "message", "챌린지 참여가 완료되었습니다.",
                    "participationIdx", savedParticipation.getParticipationIdx(),
                    "status", savedParticipation.getStatus());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("챌린지 참여 실패: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("챌린지 참여 실패", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "챌린지 참여 중 오류가 발생했습니다."));
        }
    }

}