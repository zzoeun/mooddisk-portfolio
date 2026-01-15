package com.astro.mood.web.controller.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.user.UserToken;
import com.astro.mood.security.jwt.JWTUtil;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.auth.CustomUserDetailsService;
import com.astro.mood.web.dto.ApiResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/auth")
public class AuthController {

    private final JWTUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @PostMapping("/social/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload, HttpServletResponse response) {
        try {
            String idToken = payload.get("idToken");
            if (idToken == null || idToken.isEmpty()) {
                return ResponseEntity.badRequest().body("ID Token is missing or invalid.");
            }

            Map<String, Object> userInfo = jwtUtil.verifyIdToken(idToken);

            UserDetails userDetails = customUserDetailsService.loadUser(userInfo, "GOOGLE");
            Authentication authenticated = new UsernamePasswordAuthenticationToken(userDetails, "",
                    userDetails.getAuthorities());

            // JWT 생성
            String token = jwtUtil.createJwt(authenticated);
            CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;

            // 쿠키/DB 처리 (웹 호환 및 refreshToken 발급/유지)
            handleSuccessfulAuthentication(response, authenticated);

            // 저장된 refreshToken 조회
            UserToken userToken = customUserDetailsService.findUserToken(customUserDetails.getUserIdx());
            String refreshToken = userToken != null ? userToken.getRefreshToken()
                    : jwtUtil.createRefreshToken(customUserDetails.getUserIdx());

            // 사용자 정보 구성 (모바일 클라이언트용)
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("refreshToken", refreshToken);
            responseData.put("user", Map.of(
                    "id", customUserDetails.getUserIdx().toString(),
                    "email", customUserDetails.getEmail(),
                    "name", customUserDetails.getNickname(),
                    "profileImage",
                    customUserDetails.getProfileImage() != null ? customUserDetails.getProfileImage() : ""));

            return ResponseEntity.ok(responseData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Google login failed: " + e.getMessage());
        }
    }

    @PostMapping("/social/google/mobile")
    public ResponseEntity<?> googleMobileLogin(@RequestBody Map<String, Object> payload, HttpServletResponse response) {
        try {
            String accessToken = (String) payload.get("accessToken");
            String idToken = (String) payload.get("idToken");

            Map<String, Object> userInfo;

            // idToken이 있으면 idToken으로 검증, 없으면 accessToken으로 검증
            if (idToken != null && !idToken.isEmpty()) {
                userInfo = jwtUtil.verifyIdToken(idToken);
            } else if (accessToken != null && !accessToken.isEmpty()) {
                userInfo = jwtUtil.verifyGoogleAccessToken(accessToken);
            } else {
                return ResponseEntity.badRequest().body("Access Token or ID Token is missing or invalid.");
            }

            // userInfo 검증
            if (userInfo == null || userInfo.isEmpty() || !userInfo.containsKey("sub")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Failed to verify Google token. Please try again.");
            }

            UserDetails userDetails = customUserDetailsService.loadUser(userInfo, "GOOGLE");
            Authentication authenticated = new UsernamePasswordAuthenticationToken(userDetails, "",
                    userDetails.getAuthorities());

            // JWT 생성
            String token = jwtUtil.createJwt(authenticated);
            CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;

            // 쿠키/DB 처리 (웹 호환 및 refreshToken 발급/유지)
            handleSuccessfulAuthentication(response, authenticated);

            // 저장된 refreshToken 조회
            UserToken userToken = customUserDetailsService.findUserToken(customUserDetails.getUserIdx());
            String refreshToken = userToken != null ? userToken.getRefreshToken()
                    : jwtUtil.createRefreshToken(customUserDetails.getUserIdx());

            // 사용자 정보 구성 (모바일 클라이언트용)
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("refreshToken", refreshToken);
            responseData.put("user", Map.of(
                    "id", customUserDetails.getUserIdx().toString(),
                    "email", customUserDetails.getEmail(),
                    "name", customUserDetails.getNickname(),
                    "profileImage",
                    customUserDetails.getProfileImage() != null ? customUserDetails.getProfileImage() : ""));

            return ResponseEntity.ok(responseData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Google mobile login failed: " + e.getMessage());
        }
    }

    @PostMapping("/social/kakao")
    public ResponseEntity<?> kakaoLogin(@RequestBody Map<String, String> payload, HttpServletResponse response) {
        try {
            String code = payload.get("code");
            String redirectUri = payload.get("redirectUri");

            if (code == null || code.isEmpty()) {
                return ResponseEntity.badRequest().body("Authorization code is missing or invalid.");
            }
            if (redirectUri == null || redirectUri.isEmpty()) {
                return ResponseEntity.badRequest().body("Redirect URI is missing or invalid.");
            }

            Map<String, Object> userInfo = jwtUtil.verifyCode(code, redirectUri);

            UserDetails userDetails = customUserDetailsService.loadUser(userInfo, "KAKAO");
            Authentication authenticated = new UsernamePasswordAuthenticationToken(userDetails, "",
                    userDetails.getAuthorities());

            // JWT 생성 및 쿠키 설정
            handleSuccessfulAuthentication(response, authenticated);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kakao login failed: " + e.getMessage());
        }
    }

    @PostMapping("/social/kakao/mobile")
    public ResponseEntity<?> kakaoMobileLogin(@RequestBody Map<String, Object> payload, HttpServletResponse response) {
        try {
            String accessToken = (String) payload.get("accessToken");

            if (accessToken == null || accessToken.isEmpty()) {
                return ResponseEntity.badRequest().body("Access Token is missing or invalid.");
            }

            // 카카오 액세스 토큰으로 사용자 정보 검증
            Map<String, Object> userInfo = jwtUtil.verifyKakaoAccessToken(accessToken);

            // userInfo 검증
            if (userInfo == null || userInfo.isEmpty() || !userInfo.containsKey("sub")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Failed to verify Kakao token. Please try again.");
            }

            UserDetails userDetails = customUserDetailsService.loadUser(userInfo, "KAKAO");
            Authentication authenticated = new UsernamePasswordAuthenticationToken(userDetails, "",
                    userDetails.getAuthorities());

            // JWT 생성
            String token = jwtUtil.createJwt(authenticated);
            CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;

            // 쿠키/DB 처리 (웹 호환 및 refreshToken 발급/유지)
            handleSuccessfulAuthentication(response, authenticated);

            // 저장된 refreshToken 조회 (Google/Apple과 동일)
            UserToken userToken = customUserDetailsService.findUserToken(customUserDetails.getUserIdx());
            String refreshToken = userToken != null ? userToken.getRefreshToken()
                    : jwtUtil.createRefreshToken(customUserDetails.getUserIdx());

            // 사용자 정보 구성 (모바일 클라이언트용)
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("refreshToken", refreshToken); // refreshToken 추가
            responseData.put("user", Map.of(
                    "id", customUserDetails.getUserIdx().toString(),
                    "email", customUserDetails.getEmail(),
                    "name", customUserDetails.getNickname(),
                    "profileImage",
                    customUserDetails.getProfileImage() != null ? customUserDetails.getProfileImage() : ""));

            return ResponseEntity.ok(responseData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kakao mobile login failed: " + e.getMessage());
        }
    }

    @PostMapping("/social/apple")
    public ResponseEntity<?> appleLogin(@RequestBody Map<String, Object> payload, HttpServletResponse response) {
        try {
            String identityToken = (String) payload.get("identityToken");

            if (identityToken == null || identityToken.isEmpty()) {
                return ResponseEntity.badRequest().body("Identity Token is missing or invalid.");
            }

            // Apple ID Token 검증 및 사용자 정보 추출
            Map<String, Object> userInfo = jwtUtil.verifyAppleIdToken(identityToken);

            // userInfo 검증
            if (userInfo == null || userInfo.isEmpty() || !userInfo.containsKey("sub")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Failed to verify Apple token. Please try again.");
            }

            UserDetails userDetails = customUserDetailsService.loadUser(userInfo, "APPLE");
            Authentication authenticated = new UsernamePasswordAuthenticationToken(userDetails, "",
                    userDetails.getAuthorities());

            // JWT 생성
            String token = jwtUtil.createJwt(authenticated);
            CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;

            // 쿠키/DB 처리 (웹 호환 및 refreshToken 발급/유지) - Google/Kakao와 동일한 순서
            handleSuccessfulAuthentication(response, authenticated);

            // 저장된 refreshToken 조회 (Google/Kakao와 동일)
            UserToken userToken = customUserDetailsService.findUserToken(customUserDetails.getUserIdx());
            String refreshToken = userToken != null ? userToken.getRefreshToken()
                    : jwtUtil.createRefreshToken(customUserDetails.getUserIdx());

            // 사용자 정보 구성 (모바일 클라이언트용)
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("token", token);
            responseData.put("refreshToken", refreshToken);
            responseData.put("user", Map.of(
                    "id", customUserDetails.getUserIdx().toString(),
                    "email", customUserDetails.getEmail(),
                    "name", customUserDetails.getNickname(),
                    "profileImage",
                    customUserDetails.getProfileImage() != null ? customUserDetails.getProfileImage() : ""));

            return ResponseEntity.ok(responseData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Apple login failed: " + e.getMessage());
        }
    }

    private void handleSuccessfulAuthentication(HttpServletResponse response, Authentication authResult)
            throws IOException {
        CustomUserDetails user = (CustomUserDetails) authResult.getPrincipal();
        String token = jwtUtil.createJwt(authResult);

        // DB 토큰 검색 및 갱신
        UserToken userToken = customUserDetailsService.findUserToken(user.getUserIdx());
        Integer userIdx = user.getUserIdx();

        if (userToken == null) {
            String refreshToken = jwtUtil.createRefreshToken(userIdx);
            UserToken newUserToken = UserToken.builder()
                    .accessToken(token)
                    .refreshToken(refreshToken)
                    .user(User.builder().userIdx(userIdx).build())
                    .expiresAt(LocalDateTime.now().plusDays(30)) // Refresh Token 만료 시간 설정
                    .build();
            customUserDetailsService.saveRefreshToken(newUserToken);
            userToken = newUserToken; // 새로 생성한 토큰을 userToken에 할당
        } else {
            if (jwtUtil.isExpired(userToken.getRefreshToken())) {
                String refreshToken = jwtUtil.createRefreshToken(userIdx);
                userToken.setRefreshToken(refreshToken);
                userToken.setExpiresAt(LocalDateTime.now().plusDays(30));
                customUserDetailsService.saveRefreshToken(userToken);
            }
        }

        // Access Token을 HttpOnly 쿠키로 설정
        Cookie accessTokenCookie = new Cookie("accessToken", token);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(3600); // 60분과 일치
        accessTokenCookie.setSecure(true); // HTTPS에서만 전송
        accessTokenCookie.setAttribute("SameSite", "Strict"); // CSRF 방지
        response.addCookie(accessTokenCookie);

        // Refresh Token을 HttpOnly 쿠키로 설정
        Cookie refreshTokenCookie = new Cookie("refreshToken", userToken.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(604800); // 7일
        refreshTokenCookie.setSecure(true); // HTTPS에서만 전송
        refreshTokenCookie.setAttribute("SameSite", "Strict"); // CSRF 방지
        response.addCookie(refreshTokenCookie);

        // 기존 호환성을 위해 헤더에도 추가 (프론트엔드 마이그레이션 완료 후 제거 예정)
        response.setHeader("bearer_token", token);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletResponse response) {

        // Access Token 쿠키 삭제
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0); // 즉시 삭제
        accessTokenCookie.setSecure(true);
        accessTokenCookie.setAttribute("SameSite", "Strict");
        response.addCookie(accessTokenCookie);

        // Refresh Token 쿠키 삭제
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // 즉시 삭제
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setAttribute("SameSite", "Strict");
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok(ApiResponse.ok("로그아웃되었습니다."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<?>> refreshToken(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletResponse response) {

        // JWT 필터에서 이미 토큰 갱신이 처리되었으므로 여기서는 성공 응답만 반환
        return ResponseEntity.ok(ApiResponse.ok("토큰이 갱신되었습니다."));
    }

    @PostMapping("/refresh/mobile")
    public ResponseEntity<?> refreshMobile(@RequestBody Map<String, String> payload) {
        try {
            String refreshToken = payload.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.badRequest().body("refreshToken is missing");
            }

            if (!jwtUtil.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
            }

            Integer loginIdx = jwtUtil.getLoginIdx(refreshToken);
            UserToken userToken = customUserDetailsService.findUserToken(loginIdx);
            if (userToken == null || !refreshToken.equals(userToken.getRefreshToken())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token not matched");
            }

            // DB의 expiresAt 체크 (이틀 후 자동 로그인 풀림 문제 해결)
            if (userToken.getExpiresAt() == null || userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Refresh token expired");
            }

            // 사용자 로드 및 새 토큰 생성
            CustomUserDetails userData = (CustomUserDetails) customUserDetailsService.loadUserByUserIdx(loginIdx);
            Authentication authentication = new UsernamePasswordAuthenticationToken(userData, "",
                    userData.getAuthorities());

            String newAccessToken = jwtUtil.createJwt(authentication);
            String newRefreshToken = jwtUtil.createRefreshToken(loginIdx);

            // DB에 refresh 토큰 업데이트
            userToken.setRefreshToken(newRefreshToken);
            userToken.setExpiresAt(LocalDateTime.now().plusDays(30));
            customUserDetailsService.saveRefreshToken(userToken);

            Map<String, Object> res = new HashMap<>();
            res.put("token", newAccessToken);
            res.put("refreshToken", newRefreshToken);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Refresh failed: " + e.getMessage());
        }
    }
}
