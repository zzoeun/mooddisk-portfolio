package com.astro.mood.security.filter;

import com.astro.mood.utils.XssProtectionUtil;
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
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * XSS 공격 방어 필터
 * 모든 요청의 파라미터와 헤더를 검사하여 XSS 패턴 차단
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class XssFilter extends OncePerRequestFilter {

    private final XssProtectionUtil xssProtectionUtil;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 1. Request Parameters 검증
        if (!validateParameters(request)) {
            sendXssDetectedResponse(response, "Request parameter contains XSS pattern");
            return;
        }

        // 2. Request Headers 검증 (특정 헤더만)
        if (!validateHeaders(request)) {
            sendXssDetectedResponse(response, "Request header contains XSS pattern");
            return;
        }

        // 3. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }

    /**
     * Request Parameter 검증
     */
    private boolean validateParameters(HttpServletRequest request) {
        Enumeration<String> paramNames = request.getParameterNames();

        while (paramNames.hasMoreElements()) {
            String paramName = paramNames.nextElement();
            String[] paramValues = request.getParameterValues(paramName);

            if (paramValues != null) {
                for (String paramValue : paramValues) {
                    if (paramValue != null && xssProtectionUtil.containsXss(paramValue)) {
                        log.warn("🚫 XSS 패턴 감지 - Parameter: name={}, value={}, uri={}, ip={}",
                                paramName,
                                paramValue.length() > 50 ? paramValue.substring(0, 50) + "..." : paramValue,
                                request.getRequestURI(),
                                getClientIp(request));
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Request Header 검증 (User-Agent, Referer 등)
     */
    private boolean validateHeaders(HttpServletRequest request) {
        // 검증할 헤더 목록
        String[] headersToValidate = { "User-Agent", "Referer", "X-Forwarded-For" };

        for (String headerName : headersToValidate) {
            String headerValue = request.getHeader(headerName);

            if (headerValue != null && xssProtectionUtil.containsXss(headerValue)) {
                log.warn("🚫 XSS 패턴 감지 - Header: name={}, value={}, uri={}, ip={}",
                        headerName,
                        headerValue.length() > 50 ? headerValue.substring(0, 50) + "..." : headerValue,
                        request.getRequestURI(),
                        getClientIp(request));
                return false;
            }
        }

        return true;
    }

    /**
     * XSS 탐지 응답 전송
     */
    private void sendXssDetectedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.BAD_REQUEST.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", "XSS_PATTERN_DETECTED");
        errorResponse.put("message", "요청에 허용되지 않은 스크립트 패턴이 포함되어 있습니다.");
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());

        String jsonResponse = objectMapper.writeValueAsString(errorResponse);
        response.getWriter().write(jsonResponse);
    }

    /**
     * 클라이언트 IP 추출
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // X-Forwarded-For는 여러 IP를 포함할 수 있으므로 첫 번째 IP 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    /**
     * 정적 리소스는 XSS 검증 제외
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

        // Swagger UI 제외
        if (path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-resources")) {
            return true;
        }

        return false;
    }
}
