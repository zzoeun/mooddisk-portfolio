package com.astro.mood.web.dto.user;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class UserStatsResponse {

    private LocalDate firstRecordDate; // 첫 기록일
    private Integer consecutiveDays; // 연속 기록 일수
    private Long totalDiaries; // 총 일기 수

    public static UserStatsResponse of(LocalDate firstRecordDate, Integer consecutiveDays, Long totalDiaries) {
        return UserStatsResponse.builder()
                .firstRecordDate(firstRecordDate)
                .consecutiveDays(consecutiveDays)
                .totalDiaries(totalDiaries)
                .build();
    }
}