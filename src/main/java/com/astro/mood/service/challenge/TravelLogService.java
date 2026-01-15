package com.astro.mood.service.challenge;

import com.astro.mood.data.entity.challenge.Challenge;
import com.astro.mood.data.entity.challenge.ChallengeParticipation;
import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.data.repository.challenge.ChallengeParticipationRepository;
import com.astro.mood.data.repository.challenge.ChallengeRepository;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.web.dto.challenge.TravelLogCreateRequest;
import com.astro.mood.web.dto.challenge.TravelLogResponse;
import com.astro.mood.service.location.TimezoneService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 여행 로그 서비스
 * TRAVEL 타입 챌린지(로그) 생성 및 관리
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TravelLogService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeParticipationRepository participationRepository;
    private final AuthRepository authRepository;
    private final ObjectMapper objectMapper;
    private final TimezoneService timezoneService;

    /**
     * 현재 인증된 사용자 가져오기
     */
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
     * TRAVEL.LOG 템플릿 조회 또는 생성
     * TRAVEL 타입의 Challenge는 DB에 단 하나만 존재 (템플릿 역할)
     */
    private Challenge getTravelLogTemplate() {
        return challengeRepository.findByTypeAndIsActiveTrue("TRAVEL")
                .orElseGet(() -> {
                    log.info("🌍 TRAVEL.LOG 템플릿이 없어 새로 생성합니다.");
                    Challenge travelTemplate = Challenge.builder()
                            .title("TRAVEL.LOG")
                            .description("여행을 기록하는 로그")
                            .type("TRAVEL")
                            .durationDays(null) // 기간 없음 (사용자가 직접 설정)
                            .isActive(true)
                            .participantCount(0)
                            .build();
                    return challengeRepository.save(travelTemplate);
                });
    }

    /**
     * 여행 로그 생성
     * 
     * @param request 여행 로그 생성 요청 (로그 이름, 목적지, 출발일, 귀국일)
     * @return 생성된 여행 로그 정보
     */
    @Transactional
    public TravelLogResponse createTravelLog(TravelLogCreateRequest request) {
        // 1. 입력 검증
        validateRequest(request);

        // 2. 현재 사용자 조회
        User user = getAuthenticatedUser();

        // 3. TRAVEL.LOG 템플릿 조회 또는 생성
        Challenge travelTemplate = getTravelLogTemplate();

        // 4. 로그 이름 결정 (null이면 첫 번째 목적지 이름으로 자동 설정)
        String logName = request.getLogName();
        if (logName == null || logName.trim().isEmpty()) {
            logName = extractFirstDestinationName(request.getDestinations());
        }

        // 5. 여행 기간 계산 (출발일 ~ 귀국일, 양쪽 날짜 포함)
        Integer durationDays = (int) ChronoUnit.DAYS.between(
                request.getDepartureDate(),
                request.getReturnDate()) + 1; // 출발일과 귀국일 모두 포함

        // 6. 타임존 결정 (요청에 있으면 사용, 없으면 첫 번째 목적지 좌표로 계산)
        String timezone = request.getTimezone();
        if (timezone == null || timezone.trim().isEmpty()) {
            timezone = calculateTimezoneFromDestinations(request.getDestinations());
            if (timezone != null) {
                log.info("📍 타임존 자동 계산: timezone={}", timezone);
            }
        }

        // 7. ChallengeParticipation 생성
        ChallengeParticipation participation = ChallengeParticipation.builder()
                .challenge(travelTemplate)
                .user(user)
                .logName(logName)
                .destinations(request.getDestinations())
                .startedAt(request.getDepartureDate().atStartOfDay()) // 출발일 00:00:00
                .endedAt(request.getReturnDate().atTime(23, 59, 59)) // 귀국일 23:59:59
                .durationDays(durationDays) // 여행 기간 저장
                .timezone(timezone) // 타임존 저장
                .status("ACTIVE")
                .isCompleted(false)
                .progressDays(0)
                .consecutiveDays(0)
                .completionRate(0.0)
                .build();

        // ⚠️ setEndDate() 호출하지 않음! (이미 startedAt, endedAt이 사용자 입력값으로 설정됨)

        // 8. 저장
        ChallengeParticipation savedParticipation = participationRepository.save(participation);

        log.info("✈️ 여행 로그 생성 완료: userIdx={}, logName={}, duration={} days, timezone={}",
                user.getUserIdx(), logName, durationDays, timezone);

        // 8. 응답 반환
        return TravelLogResponse.fromEntity(savedParticipation);
    }

    /**
     * destinations JSON에서 첫 번째 목적지의 좌표로 타임존 계산
     * 예: [{"lat":35.6762,"lon":139.6503,...}] -> "Asia/Tokyo"
     */
    private String calculateTimezoneFromDestinations(String destinationsJson) {
        try {
            JsonNode jsonNode = objectMapper.readTree(destinationsJson);
            if (jsonNode.isArray() && jsonNode.size() > 0) {
                JsonNode firstDestination = jsonNode.get(0);
                if (firstDestination.has("lat") && firstDestination.has("lon")) {
                    Double lat = firstDestination.get("lat").asDouble();
                    Double lon = firstDestination.get("lon").asDouble();
                    if (lat != null && lon != null && lat != 0 && lon != 0) {
                        return timezoneService.getTimezoneFromCoordinates(lat, lon);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("타임존 계산 실패: {}", e.getMessage());
        }
        return null; // 계산 실패 시 null 반환
    }

    /**
     * 요청 유효성 검증
     */
    private void validateRequest(TravelLogCreateRequest request) {
        if (request.getDestinations() == null || request.getDestinations().trim().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        if (request.getDepartureDate() == null) {
            throw new CustomException(ErrorCode.MISSING_REQUIRED_PARAMETER);
        }

        if (request.getReturnDate() == null) {
            throw new CustomException(ErrorCode.MISSING_REQUIRED_PARAMETER);
        }

        if (request.getReturnDate().isBefore(request.getDepartureDate())) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        // destinations JSON 유효성 검증
        try {
            JsonNode jsonNode = objectMapper.readTree(request.getDestinations());
            if (!jsonNode.isArray() || jsonNode.size() == 0) {
                throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
            }
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_REQUEST_BODY);
        }
    }

    /**
     * destinations JSON에서 첫 번째 목적지 이름 추출
     * 예: [{"name":"도쿄",...}] -> "도쿄"
     */
    private String extractFirstDestinationName(String destinationsJson) {
        try {
            JsonNode jsonNode = objectMapper.readTree(destinationsJson);
            if (jsonNode.isArray() && jsonNode.size() > 0) {
                JsonNode firstDestination = jsonNode.get(0);
                if (firstDestination.has("name")) {
                    return firstDestination.get("name").asText();
                }
            }
        } catch (Exception e) {
            log.warn("목적지 이름 추출 실패, 기본값 사용: {}", e.getMessage());
        }
        return "여행"; // 기본값
    }
}
