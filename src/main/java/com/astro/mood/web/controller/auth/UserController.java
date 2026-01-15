package com.astro.mood.web.controller.auth;

import com.astro.mood.security.jwt.JWTUtil;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.auth.AuthService;
import com.astro.mood.service.diary.DiaryService;
import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.service.s3Image.AwsS3Service;
import com.astro.mood.web.dto.ApiResponse;
import com.astro.mood.web.dto.auth.UserInfoRequest;
import com.astro.mood.web.dto.auth.UserInfoResponse;
import com.astro.mood.web.dto.user.UserStatsResponse;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController()
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/user")
public class UserController {
    private final AuthService authService;
    private final DiaryService diaryService;
    // s3 service
    private final AwsS3Service awsS3Service;

    private final JWTUtil jwtUtil;

    // 현재 로그인한 사용자 정보 조회 (HttpOnly 쿠키 방식용)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<?>> getCurrentUserInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }

        try {
            UserInfoResponse result = authService.getUserInfo(userDetails.getUserIdx());
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("현재 사용자 정보 조회 error : {}", e.getMessage(), e);
            throw e;
        }
    }

    // 유저정보 보기
    @GetMapping("/{loginIdx}")
    public ResponseEntity<ApiResponse<?>> getUserInfo(@PathVariable Integer loginIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 유저 검증
        authService.validateUser(userDetails, loginIdx);
        try {
            UserInfoResponse result = authService.getUserInfo(loginIdx);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("유저정보 error : {}", e.getMessage(), e);
            throw e;
        }
    }

    // 유저정보 수정
    @PutMapping("/{loginIdx}")
    public ResponseEntity<ApiResponse<?>> putUserInfo(
            @PathVariable Integer loginIdx,
            @Valid @ModelAttribute UserInfoRequest userInfoRequest,
            HttpServletResponse response,
            @RequestParam(value = "profileImage", required = false) MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 유저 검증
        authService.validateUser(userDetails, loginIdx);

        String newImageUrl = null;

        try {
            // 1. 이미지 처리 (프로필 이미지는 고정 파일명으로 저장, 기존 이미지 자동 삭제)
            log.info("프로필 수정 요청 - userIdx: {}, image 파라미터: {}, isEmpty: {}",
                    loginIdx, image != null, image != null && !image.isEmpty());

            if (image != null && !image.isEmpty()) {
                log.info("프로필 이미지 업로드 요청 - userIdx: {}, 파일명: {}, 크기: {} bytes",
                        userDetails.getUserIdx(), image.getOriginalFilename(), image.getSize());
                Integer userIdx = userDetails.getUserIdx();
                newImageUrl = awsS3Service.uploadProfileImage(image, userIdx);
                log.info("프로필 이미지 업로드 완료 - S3 키: {}", newImageUrl);
                userDetails.setProfileImage(newImageUrl);
            } else {
                log.info("프로필 이미지가 없거나 비어있음 - image: {}, isEmpty: {}",
                        image != null, image != null && image.isEmpty());
            }
            // 2. 유저정보 처리(트랜잭션)
            userInfoRequest.setUserIdx(loginIdx);
            UserInfoResponse result = authService.putUserInfo(userInfoRequest, newImageUrl);

            // JWT 토큰 재발급
            userDetails.setNickname(userInfoRequest.getNickname());
            Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, "",
                    userDetails.getAuthorities());

            String newToken = jwtUtil.createJwt(authentication);

            if (jwtUtil.validateToken(newToken)) {
                // 스프링 시큐리티 인증 토큰 생성
                authentication = jwtUtil.getAuthentication(newToken);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                response.setHeader("Bearer_Token", newToken);
            } else {
                log.error("새로 발급된 JWT 토큰이 유효하지 않습니다.");
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "유효하지 않은 토큰입니다.");
            }

            return ResponseEntity.ok(ApiResponse.ok(result));

        } catch (CustomException e) {
            if (newImageUrl != null) {
                awsS3Service.deleteImageFromS3(newImageUrl);
            }
            log.error("유저정보 수정 CustomException error : {} ", e.getMessage(), e);
            throw e;
        } catch (IOException e) {
            log.error("유저정보 수정 토큰 error : {} ", e.getMessage(), e);
            throw new CustomException(ErrorCode.UNEXPECTED_ERROR);
        } catch (Exception e) {
            log.error("유저정보 수정 error : {} ", e.getMessage(), e);
            throw e;
        }
    }

    // 회원탈퇴
    @DeleteMapping("/{loginIdx}")
    public ResponseEntity<ApiResponse<?>> deleteUserInfo(@PathVariable Integer loginIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 유저 검증
        authService.validateUser(userDetails, loginIdx);

        try {
            authService.withdrawUser(loginIdx);
            return ResponseEntity.ok(ApiResponse.ok("탈퇴되었습니다."));
        } catch (Exception e) {
            log.error("회원탈퇴 error : {}", e.getMessage(), e);
            throw e;
        }
    }

    // 이미지 ACL 관련 임시 엔드포인트 제거 (안정화)

    // 사용자 통계 정보 조회
    @GetMapping("/{loginIdx}/stats")
    public ResponseEntity<ApiResponse<UserStatsResponse>> getUserStats(
            @PathVariable Integer loginIdx,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        log.info("통계 API 호출됨 - 사용자 ID: {}", loginIdx);

        // 유저 검증
        authService.validateUser(userDetails, loginIdx);

        try {
            // 각 통계 정보 조회
            java.time.LocalDate firstRecordDate = diaryService.getFirstRecordDate(loginIdx);
            Integer consecutiveDays = diaryService.getConsecutiveDays(loginIdx);
            Long totalDiaries = diaryService.getTotalDiariesCount(loginIdx);

            // null 값들을 기본값으로 처리
            if (consecutiveDays == null)
                consecutiveDays = 0;
            if (totalDiaries == null)
                totalDiaries = 0L;

            log.info("사용자 {} 통계 조회 결과: 첫기록일={}, 연속일수={}, 총일기수={}",
                    loginIdx, firstRecordDate, consecutiveDays, totalDiaries);

            // 날짜 형식을 간단하게 변경 (yyyy.MM.dd)
            String formattedDate = null;
            if (firstRecordDate != null) {
                formattedDate = firstRecordDate.format(java.time.format.DateTimeFormatter.ofPattern("yyyy.MM.dd"));
            }

            UserStatsResponse stats = UserStatsResponse.of(
                    formattedDate != null
                            ? java.time.LocalDate.parse(formattedDate,
                                    java.time.format.DateTimeFormatter.ofPattern("yyyy.MM.dd"))
                            : null,
                    consecutiveDays, totalDiaries);
            return ResponseEntity.ok(ApiResponse.ok(stats));
        } catch (Exception e) {
            log.error("사용자 통계 조회 error : {}", e.getMessage(), e);
            throw e;
        }
    }

}
