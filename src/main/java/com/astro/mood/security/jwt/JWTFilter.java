package com.astro.mood.security.jwt;

import com.astro.mood.data.entity.user.UserToken;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.auth.CustomUserDetailsService;
import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.web.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

@RequiredArgsConstructor
@Slf4j
public class JWTFilter extends OncePerRequestFilter {

    private final JWTUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;
    private final ObjectMapper objectMapper;

    /**
     * JSON 에러 응답을 작성하는 헬퍼 메서드
     */
    private void writeJsonErrorResponse(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        CustomException exception = new CustomException(errorCode);
        ApiResponse<?> apiResponse = ApiResponse.fail(exception);

        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        objectMapper.writeValue(response.getWriter(), apiResponse);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        String requestURI = request.getRequestURI(); // 요청 URI를 가져옴
        // /v3/api-docs 경로는 JWT 인증을 통과하도록 설정
        if (requestURI.equals("/v3/api-docs") || requestURI.startsWith("/swagger-ui")
                || requestURI.startsWith("/static") || requestURI.startsWith("/logo")
                || requestURI.equals("/favicon.ico") || requestURI.equals("/manifest.json")) {
            filterChain.doFilter(request, response); // 필터 체인을 계속 진행
            return; // 더 이상 처리하지 않음
        }

        // 토큰 추출: 쿠키에서 먼저 시도, 없으면 Authorization 헤더에서
        String token = null;

        // 1. HttpOnly 쿠키에서 accessToken 가져오기
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // 2. 쿠키에 토큰이 없으면 Authorization 헤더에서 가져오기 (기존 호환성)
        if (token == null) {
            String authorization = request.getHeader("Authorization");
            if (authorization != null && authorization.startsWith("Bearer ")) {
                token = authorization.substring(7);
            }
        }

        // 토큰이 없는 경우
        if (token == null) {
            log.info("JWTFilter token null / requestURI : {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        // token 소멸 시간 검증
        if (jwtUtil.isExpired(token)) {
            // 유효기간이 만료한 경우
            log.info("token 갱신 필요 - 만료됨");
            // 1. 엑세스토큰 만료시, 리프레시토큰 만료시간 체크
            String refreshToken = "";
            // 1-1 쿠키에서 리프레시 토큰 가져오기
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if ("refreshToken".equals(cookie.getName())) {
                        refreshToken = cookie.getValue();
                    }
                }
            }

            // 1-2 리프레시 토큰 검증
            if (!jwtUtil.validateToken(refreshToken)) {
                log.warn("리프레시 토큰 검증 실패");
                writeJsonErrorResponse(response, ErrorCode.INVALID_TOKEN);
                return;
            }

            // 1-3 리프레시 토큰값으로 DB 토큰정보 가져오기
            Integer loginIdx = jwtUtil.getLoginIdx(refreshToken);
            UserToken userToken = customUserDetailsService.findUserToken(loginIdx);

            // 1-4 쿠키에서 가져온 토큰과 db에서 가져온 토큰이 같은지 확인
            if (!refreshToken.equals(userToken.getRefreshToken())) {
                log.warn("리프레시 토큰 불일치 - DB와 쿠키의 토큰이 다름");
                writeJsonErrorResponse(response, ErrorCode.INVALID_TOKEN);
                return;
            }
            refreshToken = userToken.getRefreshToken();

            // 1-4 리프레시 토큰 만료시간 체크 (JWT 만료 시간)
            if (jwtUtil.isExpired(refreshToken)) {
                log.warn("refreshToken 유효기간 만료");
                writeJsonErrorResponse(response, ErrorCode.EXPIRED_TOKEN);
                return;
            }

            // 1-5 DB의 expiresAt 체크 (이틀 후 자동 로그인 풀림 문제 해결)
            if (userToken.getExpiresAt() == null || userToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                log.warn("refreshToken DB 만료시간 초과 - expiresAt: {}", userToken.getExpiresAt());
                writeJsonErrorResponse(response, ErrorCode.EXPIRED_TOKEN);
                return;
            }

            {
                log.info("refreshToken 유효기간이 만료되지 않아 AccessToken 재발급");
                // 2. 사용자 정보를 기반으로 Authentication 객체 생성
                // CustomUserDetails userDetails = (CustomUserDetails)
                // customUserDetailsService.loadUserByUsername(userToken.getUser().getEmail());
                CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService
                        .loadUserByUserIdx(userToken.getUser().getUserIdx());
                Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, "",
                        userDetails.getAuthorities());

                String newToken = jwtUtil.createJwt(authentication);
                userToken.setAccessToken(newToken);
                customUserDetailsService.saveRefreshToken(userToken);

                token = newToken;
            }
        }

        if (jwtUtil.validateToken(token)) {
            // 스프링 시큐리티 인증 토큰 생성
            Authentication authentication = jwtUtil.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 새로운 토큰이 발급된 경우 쿠키 업데이트
            if (token != null && !token.equals(request.getHeader("Authorization"))) {
                Cookie newAccessTokenCookie = new Cookie("accessToken", token);
                newAccessTokenCookie.setHttpOnly(true);
                newAccessTokenCookie.setPath("/");
                newAccessTokenCookie.setMaxAge(3600); // 60분과 일치
                newAccessTokenCookie.setSecure(true);
                newAccessTokenCookie.setAttribute("SameSite", "Strict");
                response.addCookie(newAccessTokenCookie);
            }

            // 기존 호환성을 위해 헤더에도 추가
            response.setHeader("bearer_token", token);
        } else {
            log.warn("토큰 검증 실패");
            writeJsonErrorResponse(response, ErrorCode.INVALID_TOKEN);
            return;
        }

        // 다음 필터로 request, response 넘겨줌
        filterChain.doFilter(request, response);
    }

}