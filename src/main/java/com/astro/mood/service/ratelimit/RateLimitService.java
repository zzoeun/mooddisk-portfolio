package com.astro.mood.service.ratelimit;

import com.astro.mood.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Rate Limiting 서비스
 * API 요청 속도 제한 처리
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimitService {

    private final RateLimitConfig rateLimitConfig;

    /**
     * Rate Limit 체크 및 토큰 소비
     * 
     * @param request HTTP 요청
     * @param type    Rate Limit 타입
     * @return RateLimitResult 결과 객체
     */
    public RateLimitResult checkRateLimit(HttpServletRequest request, RateLimitConfig.RateLimitType type) {
        String key = getClientIdentifier(request);
        Bucket bucket = rateLimitConfig.resolveBucket(key, type);

        // 1개의 토큰을 소비 시도
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            // 허용됨
            log.debug("✅ Rate limit passed - IP: {}, Type: {}, Remaining: {}",
                    key, type, probe.getRemainingTokens());
            return new RateLimitResult(true, probe.getRemainingTokens(), 0);
        } else {
            // 제한 초과
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000; // 나노초를 초로 변환
            log.warn("🚫 Rate limit exceeded - IP: {}, Type: {}, Retry after: {}s",
                    key, type, waitForRefill);
            return new RateLimitResult(false, 0, waitForRefill);
        }
    }

    /**
     * 클라이언트 식별자 추출
     * 우선순위: X-Forwarded-For > Proxy-Client-IP > Remote Address
     * 
     * @param request HTTP 요청
     * @return IP 주소
     */
    private String getClientIdentifier(HttpServletRequest request) {
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

        // IPv6 loopback을 IPv4로 변환
        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            ip = "localhost";
        }

        // X-Forwarded-For는 여러 IP를 포함할 수 있으므로 첫 번째 IP 사용
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    /**
     * Rate Limit 결과 객체
     */
    public static class RateLimitResult {
        private final boolean allowed;
        private final long remainingTokens;
        private final long retryAfterSeconds;

        public RateLimitResult(boolean allowed, long remainingTokens, long retryAfterSeconds) {
            this.allowed = allowed;
            this.remainingTokens = remainingTokens;
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public boolean isAllowed() {
            return allowed;
        }

        public long getRemainingTokens() {
            return remainingTokens;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }
}
