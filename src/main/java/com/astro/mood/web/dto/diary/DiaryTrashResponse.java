package com.astro.mood.web.dto.diary;

import com.astro.mood.data.entity.diary.Diary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaryTrashResponse {
    private Integer diaryIdx;
    private String content;
    private LocalDate createdAt;
    private LocalDate deletedAt;
    private Integer emotionIdx;
    private List<String> imageUrls;

    public static DiaryTrashResponse fromEntity(Diary diary) {
        return DiaryTrashResponse.builder()
                .diaryIdx(diary.getDiaryIdx())
                .content(diary.getContent())
                .createdAt(diary.getCreatedAt() != null ? diary.getCreatedAt().toLocalDate() : null)
                .deletedAt(diary.getDeletedAt() != null ? diary.getDeletedAt().toLocalDate() : null)
                .emotionIdx(diary.getEmotionIdx())
                .imageUrls(diary.getImageUrls() != null ? new ArrayList<>(diary.getImageUrls()) : new ArrayList<>())
                .build();
    }
}