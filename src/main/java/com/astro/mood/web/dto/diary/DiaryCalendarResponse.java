package com.astro.mood.web.dto.diary;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DiaryCalendarResponse {
    private Integer diaryIdx;
    private LocalDate date;
    private Integer emotionIdx;
}