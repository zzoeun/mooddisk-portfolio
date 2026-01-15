package com.astro.mood.web.dto.challenge;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 여행 로그 생성 요청 DTO
 * 사용자가 모달에서 입력하는 여행 정보
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelLogCreateRequest {

    /**
     * 사용자 지정 로그 이름 (선택)
     * 예: "도쿄 여행", "유럽 배낭여행"
     * null이면 자동으로 첫 번째 목적지 이름으로 설정
     */
    private String logName;

    /**
     * 목적지 정보 (필수)
     * JSON 문자열 형식
     * 예:
     * [{"lat":35.6762,"lon":139.6503,"name":"도쿄","country":"일본","continent":"아시아"}]
     * 
     * ⚠️ 프론트엔드에서 지도 선택으로 생성된 JSON을 그대로 전달
     */
    private String destinations;

    /**
     * 출발일 (필수)
     * 여행 시작 날짜 (챌린지의 startedAt으로 설정됨)
     */
    private LocalDate departureDate;

    /**
     * 귀국일 (필수)
     * 여행 종료 날짜 (챌린지의 endedAt으로 설정됨)
     */
    private LocalDate returnDate;

    /**
     * 타임존 (선택)
     * 여행지의 타임존 (예: "Asia/Seoul", "Europe/Paris")
     * null이면 첫 번째 목적지의 좌표로부터 자동 계산
     */
    private String timezone;
}
