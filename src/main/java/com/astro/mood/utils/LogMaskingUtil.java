package com.astro.mood.utils;

import java.util.regex.Pattern;

/**
 * 프로덕션 환경에서 민감한 정보를 마스킹하는 유틸리티
 */
public class LogMaskingUtil {

    // 이메일 패턴
    private static final Pattern EMAIL_PATTERN = Pattern.compile("([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})");

    // 전화번호 패턴 (한국 전화번호)
    private static final Pattern PHONE_PATTERN = Pattern.compile("(\\d{3})-?(\\d{3,4})-?(\\d{4})");

    // JWT 토큰 패턴 (Bearer 토큰)
    private static final Pattern JWT_PATTERN = Pattern.compile("Bearer\\s+([A-Za-z0-9-_=]+\\.)+[A-Za-z0-9-_=]*");

    // AWS 키 패턴
    private static final Pattern AWS_KEY_PATTERN = Pattern.compile("(AKIA|ASIA)[A-Z0-9]{16}");

    // 데이터베이스 URL 패턴
    private static final Pattern DB_URL_PATTERN = Pattern.compile("jdbc:(mysql|mariadb)://[^/]+/([^?]+)");

    /**
     * 프로덕션 환경에서 민감한 정보를 마스킹
     */
    public static String maskSensitiveInfo(String message) {
        if (message == null) {
            return null;
        }

        String masked = message;

        // 이메일 마스킹
        masked = EMAIL_PATTERN.matcher(masked).replaceAll("$1***@$2");

        // 전화번호 마스킹
        masked = PHONE_PATTERN.matcher(masked).replaceAll("$1-****-$3");

        // JWT 토큰 마스킹
        masked = JWT_PATTERN.matcher(masked).replaceAll("Bearer [MASKED]");

        // AWS 키 마스킹
        masked = AWS_KEY_PATTERN.matcher(masked).replaceAll("$1[MASKED]");

        // 데이터베이스 URL 마스킹
        masked = DB_URL_PATTERN.matcher(masked).replaceAll("jdbc:$1://[MASKED]/$2");

        return masked;
    }

    /**
     * 프로덕션 환경에서 스택 트레이스를 마스킹
     */
    public static String maskStackTrace(String stackTrace) {
        if (stackTrace == null) {
            return null;
        }

        // 프로덕션에서는 스택 트레이스 전체를 마스킹
        return "[STACK_TRACE_MASKED]";
    }

    /**
     * 프로덕션 환경에서 예외 메시지를 마스킹
     */
    public static String maskExceptionMessage(String message) {
        if (message == null) {
            return null;
        }

        // 민감한 정보가 포함된 예외 메시지 마스킹
        String masked = maskSensitiveInfo(message);

        // 특정 예외 메시지 패턴 마스킹
        if (masked.contains("SQL") || masked.contains("database") || masked.contains("connection")) {
            return "Database operation failed";
        }

        if (masked.contains("S3") || masked.contains("AWS") || masked.contains("bucket")) {
            return "File operation failed";
        }

        if (masked.contains("token") || masked.contains("JWT") || masked.contains("authentication")) {
            return "Authentication failed";
        }

        return masked;
    }
}
