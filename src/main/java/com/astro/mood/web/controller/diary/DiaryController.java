package com.astro.mood.web.controller.diary;

import com.astro.mood.service.diary.DiaryService;
import com.astro.mood.utils.FileSecurityValidator;
import com.astro.mood.utils.XssProtectionUtil;
import com.astro.mood.web.dto.ApiResponse;
import com.astro.mood.web.dto.diary.DiaryCreateRequest;
import com.astro.mood.web.dto.diary.DiaryResponse;
import com.astro.mood.web.dto.diary.DiaryUpdateRequest;
import com.astro.mood.web.dto.diary.DiaryTrashResponse;
import com.astro.mood.web.dto.diary.DiaryCalendarResponse;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api")
@Slf4j
public class DiaryController {

    private final DiaryService diaryService;
    private final FileSecurityValidator fileSecurityValidator;
    private final XssProtectionUtil xssProtectionUtil;

    public DiaryController(DiaryService diaryService, FileSecurityValidator fileSecurityValidator,
            XssProtectionUtil xssProtectionUtil) {
        this.diaryService = diaryService;
        this.fileSecurityValidator = fileSecurityValidator;
        this.xssProtectionUtil = xssProtectionUtil;
    }

    // 일기쓰기
    @PostMapping(value = "/writediary", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DiaryResponse> createDiary(
            @RequestParam("content") String content,
            @RequestParam("emotionIdx") Integer emotionIdx,
            @RequestParam(value = "challengeIdx", required = false) Integer challengeIdx,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "address", required = false) String address) {

        log.info(
                "일기 작성 요청: contentLength={}, emotionIdx={}, challengeIdx={}, latitude={}, longitude={}, locationName={}",
                content.length(), emotionIdx, challengeIdx, latitude, longitude, locationName);

        // 🔒 일기 내용 검증
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("일기 내용은 필수입니다");
        }
        if (content.length() > 10000) {
            throw new IllegalArgumentException("일기는 최대 10,000자까지 작성할 수 있습니다");
        }
        if (!xssProtectionUtil.isSafe(content)) {
            throw new IllegalArgumentException("일기 내용에 허용되지 않은 패턴이 포함되어 있습니다");
        }

        // 🔒 이미지 보안 검증
        if (images != null) {
            log.info("일기 작성 요청 - 이미지 수: {}", images.size());

            // 이미지 개수 제한 (최대 3개)
            if (images.size() > 3) {
                log.warn("🚫 이미지 개수 초과: count={}, max=3", images.size());
                throw new IllegalArgumentException("이미지는 최대 3개까지 첨부할 수 있습니다");
            }

            // 각 이미지 보안 검증
            for (int i = 0; i < images.size(); i++) {
                MultipartFile image = images.get(i);
                log.info("  이미지 {}: originalFilename={}, size={}, contentType={}, isEmpty={}",
                        i + 1, image.getOriginalFilename(), image.getSize(),
                        image.getContentType(), image.isEmpty());

                // 매직 넘버, 파일 크기, 이중 확장자 등 종합 검증
                fileSecurityValidator.validateFile(image);
            }
        } else {
            log.info("일기 작성 요청 - images 파라미터가 null입니다");
        }

        // 이미지 3개까지 선택 가능
        // 위치 정보 전달 (프론트엔드에서 보낸 값 사용, 없으면 null)
        DiaryCreateRequest request = new DiaryCreateRequest(content, emotionIdx, images, challengeIdx,
                latitude, longitude, locationName, address);
        DiaryResponse response = diaryService.createDiary(request);
        return ApiResponse.created(response);
    }

    // 달력으로 내가 쓴 일기 가져오기
    @GetMapping("/mydiary")
    public ResponseEntity<ApiResponse<List<DiaryCalendarResponse>>> getDiaryCalendar(
            @RequestParam("year") Integer year,
            @RequestParam("month") Integer month) {
        List<DiaryCalendarResponse> response = diaryService.getDiaryCalendar(year, month);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 감정비트맵용 1년치 일기 데이터 조회 (성능 최적화)
    @GetMapping("/mydiary/year")
    public ResponseEntity<ApiResponse<List<DiaryCalendarResponse>>> getDiaryYear(
            @RequestParam("year") Integer year) {
        log.info("감정비트맵용 1년치 일기 데이터 조회: year={}", year);
        List<DiaryCalendarResponse> response = diaryService.getDiaryYear(year);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // 일기 상세보기
    @GetMapping("/diary/{diary_idx}")
    public ApiResponse<DiaryResponse> getDiary(@PathVariable Integer diary_idx) {
        DiaryResponse response = diaryService.getDiaryByIdx(diary_idx);
        return ApiResponse.ok(response);
    }

    // 특정 날짜의 모든 일기 조회
    @GetMapping("/diary/date/{date}")
    public ApiResponse<List<DiaryResponse>> getDiariesByDate(@PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        List<DiaryResponse> response = diaryService.getDiariesByDate(localDate);
        return ApiResponse.ok(response);
    }

    // 일기 삭제 (소프트 삭제 - 휴지통으로 이동)
    @DeleteMapping("/diary/{diary_idx}")
    public ApiResponse<Void> deleteDiary(@PathVariable Integer diary_idx) {
        diaryService.softDeleteDiary(diary_idx);
        return ApiResponse.ok(null);
    }

    // 일기 소프트 삭제 (휴지통으로 이동)
    @PostMapping("/diary/{diary_idx}/trash")
    public ApiResponse<Void> moveToTrash(@PathVariable Integer diary_idx) {
        diaryService.softDeleteDiary(diary_idx);
        return ApiResponse.ok(null);
    }

    // 휴지통 일기 목록 조회
    @GetMapping("/diary/trash")
    public ApiResponse<List<DiaryTrashResponse>> getTrashDiaries() {
        List<DiaryTrashResponse> response = diaryService.getTrashDiaries();
        return ApiResponse.ok(response);
    }

    // 일기 복원
    @PostMapping("/diary/{diary_idx}/restore")
    public ApiResponse<Void> restoreDiary(@PathVariable Integer diary_idx) {
        diaryService.restoreDiary(diary_idx);
        return ApiResponse.ok(null);
    }

    // 일기 영구 삭제
    @DeleteMapping("/diary/{diary_idx}/permanent")
    public ApiResponse<Void> permanentDeleteDiary(@PathVariable Integer diary_idx) {
        diaryService.permanentDeleteDiary(diary_idx);
        return ApiResponse.ok(null);
    }

    // 일기 수정
    @PutMapping(value = "/diary/{diary_idx}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DiaryResponse> updateDiary(
            @PathVariable Integer diary_idx,
            @RequestParam("content") String content,
            @RequestParam("emotionIdx") Integer emotionIdx,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "removedImageUrls", required = false) String removedImageUrlsJson,
            @RequestParam(value = "challengeIdx", required = false) Integer challengeIdx,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "address", required = false) String address) {

        log.info(
                "일기 수정 요청: diary_idx={}, contentLength={}, emotionIdx={}, challengeIdx={}, latitude={}, longitude={}, locationName={}",
                diary_idx, content.length(), emotionIdx, challengeIdx, latitude, longitude, locationName);

        // 🔒 일기 내용 검증
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("일기 내용은 필수입니다");
        }
        if (content.length() > 10000) {
            throw new IllegalArgumentException("일기는 최대 10,000자까지 작성할 수 있습니다");
        }
        if (!xssProtectionUtil.isSafe(content)) {
            throw new IllegalArgumentException("일기 내용에 허용되지 않은 패턴이 포함되어 있습니다");
        }

        // 🔒 이미지 보안 검증
        if (images != null) {
            log.info("일기 수정 요청 - 이미지 수: {}", images.size());

            // 이미지 개수 제한 (최대 3개)
            if (images.size() > 3) {
                log.warn("🚫 이미지 개수 초과: count={}, max=3", images.size());
                throw new IllegalArgumentException("이미지는 최대 3개까지 첨부할 수 있습니다");
            }

            // 각 이미지 보안 검증
            for (int i = 0; i < images.size(); i++) {
                MultipartFile image = images.get(i);
                log.info("  이미지 {}: originalFilename={}, size={}, contentType={}, isEmpty={}",
                        i + 1, image.getOriginalFilename(), image.getSize(),
                        image.getContentType(), image.isEmpty());

                // 매직 넘버, 파일 크기, 이중 확장자 등 종합 검증
                fileSecurityValidator.validateFile(image);
            }
        } else {
            log.info("일기 수정 요청 - images 파라미터가 null입니다");
        }

        if (removedImageUrlsJson != null && !removedImageUrlsJson.isEmpty()) {
            log.info("일기 수정 요청 - 삭제할 이미지 URLs: {}", removedImageUrlsJson);
        }

        List<String> removedImageUrls = null;
        if (removedImageUrlsJson != null && !removedImageUrlsJson.isEmpty()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                removedImageUrls = objectMapper.readValue(removedImageUrlsJson, new TypeReference<List<String>>() {
                });
            } catch (Exception e) {
                log.error("removedImageUrls 파싱 실패: {}", e.getMessage());
                throw new RuntimeException("Invalid removedImageUrls JSON format");
            }
        }

        // 위치 정보 전달 (프론트엔드에서 보낸 값 사용, 없으면 null)
        DiaryUpdateRequest updateRequest = new DiaryUpdateRequest(content, emotionIdx, images,
                removedImageUrls, challengeIdx, latitude, longitude, locationName, address);
        DiaryResponse response = diaryService.updateDiary(diary_idx, updateRequest);

        return ApiResponse.ok(response);
    }

}
