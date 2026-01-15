package com.astro.mood.security.filter;

import com.astro.mood.config.RateLimitConfig;
import com.astro.mood.service.ratelimit.RateLimitService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Rate Limiting 필터
 * 모든 HTTP 요청에 대해 속도 제한을 적용
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String method = request.getMethod();

        // Rate Limit 타입 결정
        RateLimitConfig.RateLimitType limitType = determineRateLimitType(requestUri, method);

        // Rate Limit 체크
        RateLimitService.RateLimitResult result = rateLimitService.checkRateLimit(request, limitType);

        // 응답 헤더에 Rate Limit 정보 추가
        response.setHeader("X-Rate-Limit-Limit", String.valueOf(limitType.getCapacity()));
        response.setHeader("X-Rate-Limit-Remaining", String.valueOf(result.getRemainingTokens()));

        if (!result.isAllowed()) {
            // Rate Limit 초과 시 429 응답
            response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(result.getRetryAfterSeconds()));
            sendRateLimitExceededResponse(response, result.getRetryAfterSeconds());
            return;
        }

        // 다음 필터로 진행
        filterChain.doFilter(request, response);
    }

    /**
     * 요청 URI와 메서드에 따라 Rate Limit 타입 결정
     */
    private RateLimitConfig.RateLimitType determineRateLimitType(String uri, String method) {
        // 인증 관련
        if (uri.contains("/login") || uri.contains("/signin")) {
            return RateLimitConfig.RateLimitType.AUTH_LOGIN;
        }
        if (uri.contains("/register") || uri.contains("/signup") || uri.contains("/join")) {
            return RateLimitConfig.RateLimitType.AUTH_REGISTER;
        }
        if (uri.contains("/refresh") || uri.contains("/reissue")) {
            return RateLimitConfig.RateLimitType.AUTH_TOKEN_REFRESH;
        }

        // 일기 관련
        if (uri.contains("/writediary") || (uri.contains("/diary") && "POST".equals(method))) {
            return RateLimitConfig.RateLimitType.DIARY_CREATE;
        }
        if (uri.contains("/diary") && "PUT".equals(method)) {
            return RateLimitConfig.RateLimitType.DIARY_UPDATE;
        }
        if (uri.contains("/diary") && "GET".equals(method)) {
            return RateLimitConfig.RateLimitType.DIARY_READ;
        }

        // 파일 업로드 관련
        if (uri.contains("/upload") || (uri.contains("/image") && "POST".equals(method))) {
            return RateLimitConfig.RateLimitType.FILE_UPLOAD;
        }

        // 프로필 수정
        if (uri.contains("/user") && "PUT".equals(method)) {
            return RateLimitConfig.RateLimitType.PROFILE_UPDATE;
        }

        // 기본값
        return RateLimitConfig.RateLimitType.GENERAL_API;
    }

    /**
     * Rate Limit 초과 응답 전송
     */
    private void sendRateLimitExceededResponse(HttpServletResponse response, long retryAfterSeconds)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "TOO_MANY_REQUESTS");
        errorResponse.put("message", "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.");
        errorResponse.put("retryAfterSeconds", retryAfterSeconds);
        errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());

        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);

        log.warn("🚫 Rate limit exceeded - URI: {}, Retry after: {}s",
                response.getHeader("X-Original-URI"), retryAfterSeconds);
    }

    /**
     * 정적 리소스와 헬스체크는 Rate Limit 제외
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // 정적 리소스 제외
        if (path.startsWith("/static/") ||
                path.startsWith("/css/") ||
                path.startsWith("/js/") ||
                path.startsWith("/images/") ||
                path.startsWith("/favicon.ico")) {
            return true;
        }

        // 헬스체크 제외
        if (path.equals("/health") ||
                path.equals("/actuator/health") ||
                path.equals("/api/health")) {
            return true;
        }

        // Swagger UI 제외 (개발 환경)
        if (path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-resources")) {
            return true;
        }

        return false;
    }
}
