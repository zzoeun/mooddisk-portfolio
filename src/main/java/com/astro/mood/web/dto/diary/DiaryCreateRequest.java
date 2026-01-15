package com.astro.mood.web.dto.diary;

import com.astro.mood.validation.SafeText;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiaryCreateRequest {
    @NotBlank(message = "내용을 입력해주세요.")
    @SafeText(maxLength = 10000, message = "일기는 최대 10,000자까지 작성할 수 있습니다")
    private String content;

    @NotNull(message = "감정 선택은 필수입니다")
    private Integer emotionIdx;

    private List<MultipartFile> images;

    private Integer challengeIdx; // 선택된 챌린지 ID

    // 위치 정보 (여행 로그용)
    private Double latitude; // 위도
    private Double longitude; // 경도
    private String locationName; // 장소명
    private String address; // 주소
}