package com.astro.mood.service.location;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import us.dustinj.timezonemap.TimeZoneMap;

/**
 * GPS 좌표를 기반으로 타임존을 계산하는 서비스
 * 여행 로그에서 각 일기의 작성 위치에 따른 정확한 타임존을 제공
 */
@Slf4j
@Service
public class TimezoneService {

    private final TimeZoneMap timeZoneMap;

    public TimezoneService() {
        // TimeZoneMap 인스턴스 생성 (전 세계 타임존 데이터)
        this.timeZoneMap = TimeZoneMap.forEverywhere();
        log.info("✅ TimezoneService initialized with global timezone data");
    }

    /**
     * GPS 좌표로부터 타임존 ID를 계산
     * 
     * @param latitude  위도 (-90.0 ~ 90.0)
     * @param longitude 경도 (-180.0 ~ 180.0)
     * @return 타임존 ID (예: "Asia/Seoul", "Europe/Paris") 또는 null
     */
    public String getTimezoneFromCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            log.debug("Latitude or longitude is null, returning null timezone");
            return null;
        }

        // 좌표 범위 검증
        if (!isValidCoordinate(latitude, longitude)) {
            log.warn("Invalid coordinates: lat={}, lon={}", latitude, longitude);
            return null;
        }

        try {
            us.dustinj.timezonemap.TimeZone timeZone = timeZoneMap.getOverlappingTimeZone(latitude, longitude);

            if (timeZone != null) {
                String timezone = timeZone.getZoneId();
                log.debug("📍 Timezone calculated: {} for coordinates ({}, {})",
                        timezone, latitude, longitude);
                return timezone;
            } else {
                log.warn("No timezone found for coordinates: lat={}, lon={}", latitude, longitude);
                return null;
            }
        } catch (Exception e) {
            log.error("Error calculating timezone for coordinates ({}, {}): {}",
                    latitude, longitude, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 좌표 유효성 검증
     * 
     * @param latitude  위도
     * @param longitude 경도
     * @return 유효하면 true
     */
    private boolean isValidCoordinate(Double latitude, Double longitude) {
        return latitude >= -90.0 && latitude <= 90.0
                && longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * 타임존 ID가 유효한지 검증
     * 
     * @param timezoneId 타임존 ID
     * @return 유효하면 true
     */
    public boolean isValidTimezone(String timezoneId) {
        if (timezoneId == null || timezoneId.trim().isEmpty()) {
            return false;
        }

        try {
            java.util.TimeZone.getTimeZone(timezoneId);
            return true;
        } catch (Exception e) {
            log.warn("Invalid timezone ID: {}", timezoneId);
            return false;
        }
    }
}
