package com.astro.mood.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * 보안 위협 요청을 조기에 차단하는 필터
 * - 알려진 취약점 경로 차단
 * - 의심스러운 요청 패턴 감지
 * - 로그 레벨 최적화 (ERROR -> WARN)
 */
@Component
@Slf4j
public class SecurityThreatFilter extends OncePerRequestFilter {

    // 차단할 의심스러운 경로 패턴
    private static final List<String> SUSPICIOUS_PATHS = Arrays.asList(
            // PHP 취약점 공격
            "/vendor/phpunit/phpunit",
            "/phpunit",
            "/eval-stdin.php",
            // 환경 변수 파일 접근
            "/.env",
            "/.env.local",
            "/.env.production",
            "/config.php",
            "/wp-config.php",
            // Docker API 접근
            "/containers/json",
            "/containers/",
            "/docker/",
            // 프레임워크 취약점
            "/laravel/",
            "/yii/",
            "/zend/",
            "/symfony/",
            "/thinkphp/",
            "/codeigniter/",
            // 관리자 패널 시도
            "/admin/",
            "/wp-admin/",
            "/phpmyadmin/",
            "/phpMyAdmin/",
            "/administrator/",
            // 기타 취약점
            "/.git/",
            "/.svn/",
            "/.DS_Store",
            "/backup/",
            "/backups/",
            "/shell.php",
            "/cmd.php",
            "/c99.php",
            "/r57.php",
            // 라우터/네트워크 장비 취약점
            "/GponForm/",
            "/cgi-bin/",
            "/.well-known/",
            // ASP.NET 취약점
            "/Core/Skin/",
            "/bin/",
            "/App_Data/");

    // 허용할 정상 경로 (우선순위 높음)
    private static final List<String> ALLOWED_PATHS = Arrays.asList(
            "/",
            "/api/",
            "/static/",
            "/favicon.ico",
            "/manifest.json",
            "/index.html",
            "/swagger-ui",
            "/v3/api-docs");

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI().toLowerCase();
        String clientIP = getClientIP(request);
        String method = request.getMethod();

        // 정상 경로는 통과
        if (isAllowedPath(requestURI)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 의심스러운 경로 체크
        if (isSuspiciousPath(requestURI)) {
            // WARN 레벨로 로깅 (ERROR가 아님)
            log.warn("🚫 Security threat detected - IP: {}, Method: {}, URI: {}",
                    clientIP, method, requestURI);

            // 404 응답 (공격자에게 정보 제공 최소화)
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Not Found\"}");
            return;
        }

        // 정상 요청은 통과
        filterChain.doFilter(request, response);
    }

    /**
     * 정상 경로인지 확인
     */
    private boolean isAllowedPath(String requestURI) {
        return ALLOWED_PATHS.stream()
                .anyMatch(requestURI::startsWith);
    }

    /**
     * 의심스러운 경로인지 확인
     */
    private boolean isSuspiciousPath(String requestURI) {
        return SUSPICIOUS_PATHS.stream()
                .anyMatch(requestURI::contains);
    }

    /**
     * 클라이언트 IP 주소 추출 (프록시 환경 고려)
     */
    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // X-Forwarded-For는 여러 IP가 있을 수 있음 (첫 번째가 실제 클라이언트)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip != null ? ip : "unknown";
    }
}

