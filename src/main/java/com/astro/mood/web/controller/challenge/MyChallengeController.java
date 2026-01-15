package com.astro.mood.web.controller.challenge;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import com.astro.mood.service.challenge.MyChallengeService;
import com.astro.mood.web.dto.challenge.MyChallengeResponse;
import com.astro.mood.security.login.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 내 챌린지(내가 참여한 챌린지) 관련 API만 담당하는 컨트롤러
 * - 전체 챌린지와 분리하여, 내 챌린지 목록/상세 등만 관리
 */
@Slf4j
@RestController
@RequestMapping("/api/my-challenge")
@RequiredArgsConstructor
public class MyChallengeController {
    private final AuthRepository authRepository;
    private final ChallengeParticipationRepository participationRepository;
    private final MyChallengeService myChallengeService;

    /**
     * 내가 참여한 챌린지 목록 조회
     * 
     * @param userDetails 인증된 사용자 정보(필수)
     * @return 내가 참여한 챌린지 목록
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyChallenges(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("[getMyChallenges] userDetails: {}", userDetails);
        if (userDetails == null) {
            log.warn("[getMyChallenges] userDetails is null (로그인 필요)");
            return ResponseEntity.status(401).build();
        }

        try {
            // 사용자 정보 조회
            User user = authRepository.findById(userDetails.getUserIdx())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            log.info("[getMyChallenges] user: {}", user);

            // 사용자가 참여 중인 모든 챌린지 조회 (최신 참여 순)
            List<ChallengeParticipation> participations = participationRepository.findByUserOrderByStartedAtDesc(user);
            log.info("[getMyChallenges] participations.size: {}", participations.size());

            // 모든 상태의 챌린지 포함 (ACTIVE, COMPLETED, FAILED 등)
            List<MyChallengeResponse> responseList = participations.stream()
                    .map(MyChallengeResponse::fromParticipation)
                    .toList();
            log.info("[getMyChallenges] responseList.size: {}", responseList.size());

            Map<String, Object> response = Map.of(
                    "isSuccess", true,
                    "data", responseList);

            log.info("[getMyChallenges] 정상 응답 반환");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("[getMyChallenges] IllegalArgumentException: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "isSuccess", false,
                    "data", List.of(),
                    "message", e.getMessage()));
        } catch (Exception e) {
            log.error("[getMyChallenges] Exception: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "isSuccess", false,
                    "data", List.of(),
                    "message", "서버 오류가 발생했습니다."));
        }
    }

    /**
     * 특정 날짜 이전에 시작된 내 챌린지 목록 조회 (일기 수정용)
     * 
     * @param userDetails 인증된 사용자 정보(필수)
     * @param beforeDate  기준 날짜 (ISO 8601 형식: yyyy-MM-ddTHH:mm:ss)
     * @return 특정 날짜 이전에 시작된 내 챌린지 목록
     */
    @GetMapping("/before-date")
    public ResponseEntity<Map<String, Object>> getMyChallengesBeforeDate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String beforeDate) {
        log.info("[getMyChallengesBeforeDate] userDetails: {}, beforeDate: {}", userDetails, beforeDate);

        if (userDetails == null) {
            log.warn("[getMyChallengesBeforeDate] userDetails is null (로그인 필요)");
            return ResponseEntity.status(401).build();
        }

        try {
            // 사용자 정보 조회
            User user = authRepository.findById(userDetails.getUserIdx())
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            log.info("[getMyChallengesBeforeDate] user: {}", user);

            // 날짜 파싱
            LocalDateTime beforeDateTime = LocalDateTime.parse(beforeDate, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            log.info("[getMyChallengesBeforeDate] beforeDateTime: {}", beforeDateTime);

            // 특정 날짜 이전에 시작된 챌린지 조회
            List<MyChallengeResponse> responseList = myChallengeService.getMyChallengeListBeforeDate(user,
                    beforeDateTime);
            log.info("[getMyChallengesBeforeDate] responseList.size: {}", responseList.size());

            Map<String, Object> response = Map.of(
                    "isSuccess", true,
                    "data", responseList);

            log.info("[getMyChallengesBeforeDate] 정상 응답 반환");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("[getMyChallengesBeforeDate] IllegalArgumentException: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "isSuccess", false,
                    "data", List.of(),
                    "message", e.getMessage()));
        } catch (Exception e) {
            log.error("[getMyChallengesBeforeDate] Exception: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "isSuccess", false,
                    "data", List.of(),
                    "message", "서버 오류가 발생했습니다."));
        }
    }
}