package com.astro.mood.data.entity.diary;

import com.astro.mood.data.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Table(name = "diary", indexes = {
        @Index(name = "idx_diary_user_created", columnList = "user_idx, created_at"),
        @Index(name = "idx_diary_user_deleted", columnList = "user_idx, deleted_at"),
        @Index(name = "idx_diary_created_year", columnList = "created_at")
})
public class Diary {
    @Id
    @Column(name = "diary_idx")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer diaryIdx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_idx")
    private User user;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content; // GCM ciphertext||tag (Base64 encoded)

    @Column(name = "iv", length = 24)
    private String iv; // GCM Initialization Vector (Base64 encoded)

    @Column(name = "emotion_idx")
    private Integer emotionIdx;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "diary_imageurls", joinColumns = @JoinColumn(name = "diary_idx"))
    @Column(name = "image_urls")
    @Builder.Default
    private Set<String> imageUrls = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // 챌린지 연동 필드
    @Column(name = "challenge_participation_idx")
    private Integer challengeParticipationIdx; // 챌린지 참여 ID (null이면 일반 일기)

    // 위치 정보 필드 (여행 로그, 위치 기반 로그용)
    @Column(name = "latitude")
    private Double latitude; // 위도

    @Column(name = "longitude")
    private Double longitude; // 경도

    @Column(name = "location_name")
    private String locationName; // 장소명 (예: "센소지", "스카이트리")

    @Column(name = "address")
    private String address; // 주소

    @Column(name = "timezone")
    private String timezone; // 일기 작성 시점의 타임존 (예: "Asia/Seoul", "Europe/Paris")

    /**
     * 엔티티 저장 전 실행되는 콜백
     * 타임존이 있으면 해당 타임존의 현재 시간으로 createdAt 설정, 없으면 서버 시간 사용
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            if (timezone != null && !timezone.trim().isEmpty()) {
                try {
                    // 타임존의 현재 시간을 LocalDateTime으로 변환
                    createdAt = ZonedDateTime.now(ZoneId.of(timezone)).toLocalDateTime();
                } catch (Exception e) {
                    // 타임존 파싱 실패 시 서버 시간 사용
                    createdAt = LocalDateTime.now();
                }
            } else {
                // 타임존이 없으면 서버 시간 사용
                createdAt = LocalDateTime.now();
            }
        }
    }
}
