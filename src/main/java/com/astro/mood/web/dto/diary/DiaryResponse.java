package com.astro.mood.web.dto.diary;

import com.astro.mood.data.entity.diary.Diary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiaryResponse {
    // 일기 정보
    private Integer diaryIdx;
    private String content;
    private LocalDateTime createdAt;
    private Integer userIdx;
    // 감정 정보 (단일)
    private Integer emotionIdx;

    // 첨부 이미지 URL 목록
    private List<String> imageUrls;

    // 챌린지 정보 (일기 작성 시 참여 중인 챌린지)
    private List<ChallengeInfo> challenges;

    // 현재 연결된 챌린지 ID (모바일 수정용)
    private Integer challengeIdx;

    // 위치 정보 (여행 로그용)
    private Double latitude; // 위도
    private Double longitude; // 경도
    private String locationName; // 장소명
    private String address; // 주소
    private String timezone; // 타임존

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChallengeInfo {
        private String title; // 챌린지 제목
        private String status; // 상태 (ACTIVE, COMPLETED, FAILED)
    }

    // 단순화된 엔티티 변환 메서드
    public static DiaryResponse fromEntity(Diary diary) {
        return DiaryResponse.builder()
                .diaryIdx(diary.getDiaryIdx())
                .content(diary.getContent())
                .createdAt(diary.getCreatedAt())
                .userIdx(diary.getUser() != null ? diary.getUser().getUserIdx() : null)
                .emotionIdx(diary.getEmotionIdx())
                .imageUrls(diary.getImageUrls() != null ? new ArrayList<>(diary.getImageUrls()) : new ArrayList<>())
                .challenges(new ArrayList<>()) // 기본값으로 빈 리스트 설정
                .challengeIdx(null) // 기본값으로 null 설정
                .latitude(diary.getLatitude())
                .longitude(diary.getLongitude())
                .locationName(diary.getLocationName())
                .address(diary.getAddress())
                .timezone(diary.getTimezone())
                .build();
    }

    // 챌린지 정보를 포함한 응답 생성
    public static DiaryResponse fromEntityWithChallenges(Diary diary, List<ChallengeInfo> challenges) {
        DiaryResponse response = fromEntity(diary);
        response.setChallenges(challenges != null ? challenges : new ArrayList<>());
        response.setChallengeIdx(null); // 기본값으로 null 설정
        return response;
    }
}