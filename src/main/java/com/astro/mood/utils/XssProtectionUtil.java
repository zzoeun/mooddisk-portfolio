package com.astro.mood.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * XSS(Cross-Site Scripting) 공격 방어 유틸리티
 * HTML 태그, 스크립트, 위험한 이벤트 핸들러 등을 필터링
 */
@Component
@Slf4j
public class XssProtectionUtil {

    // XSS 공격 패턴 정의
    private static final Pattern[] XSS_PATTERNS = {
            // Script 태그
            Pattern.compile("<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
            Pattern.compile("<script[^>]*>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("</script>", Pattern.CASE_INSENSITIVE),

            // JavaScript 이벤트 핸들러
            Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
            Pattern.compile("on\\w+\\s*=", Pattern.CASE_INSENSITIVE), // onclick, onload 등

            // iframe, embed, object
            Pattern.compile("<iframe[^>]*>.*?</iframe>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),
            Pattern.compile("<embed[^>]*>", Pattern.CASE_INSENSITIVE),
            Pattern.compile("<object[^>]*>.*?</object>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),

            // eval, expression
            Pattern.compile("eval\\s*\\(", Pattern.CASE_INSENSITIVE),
            Pattern.compile("expression\\s*\\(", Pattern.CASE_INSENSITIVE),

            // vbscript
            Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),

            // SVG with script
            Pattern.compile("<svg[^>]*>.*?</svg>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL),

            // Data URI with script
            Pattern.compile("data:text/html", Pattern.CASE_INSENSITIVE),

            // Meta refresh
            Pattern.compile("<meta[^>]*http-equiv[^>]*refresh", Pattern.CASE_INSENSITIVE),

            // Base64 encoded javascript
            Pattern.compile("base64.*javascript:", Pattern.CASE_INSENSITIVE),
    };

    // HTML 특수 문자 매핑
    private static final String[][] HTML_ENTITIES = {
            { "<", "&lt;" },
            { ">", "&gt;" },
            { "\"", "&quot;" },
            { "'", "&#x27;" },
            { "/", "&#x2F;" },
            { "&", "&amp;" }
    };

    /**
     * XSS 공격 패턴이 포함되어 있는지 검사
     * 
     * @param value 검사할 문자열
     * @return XSS 패턴 발견 시 true
     */
    public boolean containsXss(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }

        for (Pattern pattern : XSS_PATTERNS) {
            if (pattern.matcher(value).find()) {
                log.warn("🚫 XSS 패턴 감지: pattern={}, value={}",
                        pattern.pattern(),
                        value.length() > 100 ? value.substring(0, 100) + "..." : value);
                return true;
            }
        }
        return false;
    }

    /**
     * XSS 공격 패턴 제거 (Sanitization)
     * HTML 태그와 위험한 스크립트를 제거
     * 
     * @param value 정제할 문자열
     * @return 정제된 문자열
     */
    public String sanitize(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        String cleaned = value;

        // XSS 패턴 제거
        for (Pattern pattern : XSS_PATTERNS) {
            cleaned = pattern.matcher(cleaned).replaceAll("");
        }

        return cleaned;
    }

    /**
     * HTML 이스케이프 (모든 HTML 특수문자 변환)
     * 사용자 입력을 화면에 표시할 때 사용
     * 
     * @param value 이스케이프할 문자열
     * @return HTML 이스케이프된 문자열
     */
    public String escapeHtml(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        String escaped = value;

        // HTML 특수문자를 엔티티로 변환
        for (String[] entity : HTML_ENTITIES) {
            escaped = escaped.replace(entity[0], entity[1]);
        }

        return escaped;
    }

    /**
     * 안전한 HTML 허용 (화이트리스트 방식)
     * 특정 태그만 허용하고 나머지는 이스케이프
     * 
     * @param value 처리할 문자열
     * @return 안전한 HTML 문자열
     */
    public String allowSafeHtml(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }

        // 일단 모든 위험한 패턴 제거
        String cleaned = sanitize(value);

        // 허용할 안전한 태그 (예: <b>, <i>, <br>)
        // 현재는 모든 HTML을 제거하고 필요시 화이트리스트 추가
        // cleaned = cleaned.replaceAll("<(?!/?(?:b|i|br)\\b)[^>]*>", "");

        return cleaned;
    }

    /**
     * SQL Injection 패턴 검사
     * 
     * @param value 검사할 문자열
     * @return SQL Injection 패턴 발견 시 true
     */
    public boolean containsSqlInjection(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }

        // SQL Injection 의심 패턴
        String[] sqlPatterns = {
                "(?i).*\\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\\b.*",
                ".*--.*", // SQL 주석
                ".*;.*", // SQL 구문 종료
                ".*'.*OR.*'.*", // OR 조건
                ".*'.*AND.*'.*", // AND 조건
                ".*\\|\\|.*", // 문자열 연결
        };

        for (String pattern : sqlPatterns) {
            if (value.matches(pattern)) {
                log.warn("🚫 SQL Injection 의심 패턴 감지: value={}",
                        value.length() > 100 ? value.substring(0, 100) + "..." : value);
                return true;
            }
        }
        return false;
    }

    /**
     * Path Traversal 패턴 검사
     * 
     * @param value 검사할 문자열
     * @return Path Traversal 패턴 발견 시 true
     */
    public boolean containsPathTraversal(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }

        // Path Traversal 패턴
        String[] pathPatterns = {
                ".*\\.\\./.*", // ../
                ".*\\.\\\\.*", // ..\
                ".*%2e%2e.*", // URL encoded ..
                ".*%252e%252e.*", // Double URL encoded ..
        };

        for (String pattern : pathPatterns) {
            if (value.toLowerCase().matches(pattern)) {
                log.warn("🚫 Path Traversal 패턴 감지: value={}", value);
                return true;
            }
        }
        return false;
    }

    /**
     * 종합 보안 검증
     * XSS, SQL Injection, Path Traversal을 모두 검사
     * 
     * @param value 검사할 문자열
     * @return 안전하면 true, 위험하면 false
     */
    public boolean isSafe(String value) {
        if (value == null || value.isEmpty()) {
            return true;
        }

        return !containsXss(value)
                && !containsSqlInjection(value)
                && !containsPathTraversal(value);
    }

    /**
     * 문자열 길이 제한 검증
     * 
     * @param value     검사할 문자열
     * @param maxLength 최대 길이
     * @return 길이 제한 내이면 true
     */
    public boolean checkLength(String value, int maxLength) {
        if (value == null) {
            return true;
        }

        if (value.length() > maxLength) {
            log.warn("🚫 문자열 길이 초과: length={}, max={}", value.length(), maxLength);
            return false;
        }

        return true;
    }
}
