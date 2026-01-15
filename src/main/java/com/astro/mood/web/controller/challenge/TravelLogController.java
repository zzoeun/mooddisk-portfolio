package com.astro.mood.web.controller.challenge;

import com.astro.mood.service.challenge.TravelLogService;
import com.astro.mood.web.dto.ApiResponse;
import com.astro.mood.web.dto.challenge.TravelLogCreateRequest;
import com.astro.mood.web.dto.challenge.TravelLogResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 여행 로그 API 컨트롤러
 * 
 * 엔드포인트:
 * - POST /api/travel-logs : 여행 로그 생성
 */
@RestController
@RequestMapping("/api/travel-logs")
@RequiredArgsConstructor
@Slf4j
public class TravelLogController {

    private final TravelLogService travelLogService;

    /**
     * 여행 로그 생성
     * 
     * 사용자가 모달에서 여행 정보 입력 후 생성
     * - 로그 이름 (선택)
     * - 목적지 (JSON 배열, 필수)
     * - 출발일 (필수)
     * - 귀국일 (필수)
     * 
     * @param request 여행 로그 생성 요청
     * @return 생성된 여행 로그 정보
     */
    @PostMapping
    public ApiResponse<TravelLogResponse> createTravelLog(
            @RequestBody TravelLogCreateRequest request) {

        log.info("✈️ 여행 로그 생성 요청: logName={}, departureDate={}, returnDate={}",
                request.getLogName(), request.getDepartureDate(), request.getReturnDate());

        TravelLogResponse response = travelLogService.createTravelLog(request);

        return ApiResponse.created(response);
    }
}
