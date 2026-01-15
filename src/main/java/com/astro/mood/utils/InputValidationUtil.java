package com.astro.mood.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * 입력 검증 유틸리티
 * 이메일, 전화번호, 닉네임 등 다양한 입력값 검증
 */
@Component
@Slf4j
public class InputValidationUtil {

    // 이메일 패턴 (RFC 5322 기반 간소화)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");

    // 전화번호 패턴 (한국 형식: 010-1234-5678 또는 01012345678)
    private static final Pattern PHONE_PATTERN = Pattern.compile(
            "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$");

    // 닉네임 패턴 (한글, 영문, 숫자, 2-10자)
    private static final Pattern NICKNAME_PATTERN = Pattern.compile(
            "^[가-힣a-zA-Z0-9]{2,10}$");

    // URL 패턴
    private static final Pattern URL_PATTERN = Pattern.compile(
            "^https?://[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$");

    // 특수문자 제외 패턴 (한글, 영문, 숫자, 공백만 허용)
    private static final Pattern SAFE_TEXT_PATTERN = Pattern.compile(
            "^[가-힣a-zA-Z0-9\\s.,!?\\-_]*$");

    /**
     * 이메일 형식 검증
     * 
     * @param email 검증할 이메일
     * @return 유효하면 true
     */
    public boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        // 길이 제한 (최대 100자)
        if (email.length() > 100) {
            log.warn("🚫 이메일 길이 초과: length={}", email.length());
            return false;
        }

        boolean valid = EMAIL_PATTERN.matcher(email).matches();
        if (!valid) {
            log.warn("🚫 잘못된 이메일 형식: email={}", maskEmail(email));
        }
        return valid;
    }

    /**
     * 전화번호 형식 검증
     * 
     * @param phone 검증할 전화번호
     * @return 유효하면 true
     */
    public boolean isValidPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }

        // 하이픈 제거
        String cleanPhone = phone.replaceAll("-", "");

        boolean valid = PHONE_PATTERN.matcher(cleanPhone).matches();
        if (!valid) {
            log.warn("🚫 잘못된 전화번호 형식: phone={}", maskPhone(phone));
        }
        return valid;
    }

    /**
     * 닉네임 형식 검증
     * 
     * @param nickname 검증할 닉네임
     * @return 유효하면 true
     */
    public boolean isValidNickname(String nickname) {
        if (nickname == null || nickname.trim().isEmpty()) {
            return false;
        }

        // 길이 제한 (2-10자)
        if (nickname.length() < 2 || nickname.length() > 10) {
            log.warn("🚫 닉네임 길이 제한: length={}, min=2, max=10", nickname.length());
            return false;
        }

        boolean valid = NICKNAME_PATTERN.matcher(nickname).matches();
        if (!valid) {
            log.warn("🚫 잘못된 닉네임 형식: nickname={}", nickname);
        }
        return valid;
    }

    /**
     * URL 형식 검증
     * 
     * @param url 검증할 URL
     * @return 유효하면 true
     */
    public boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }

        // 길이 제한 (최대 500자)
        if (url.length() > 500) {
            log.warn("🚫 URL 길이 초과: length={}", url.length());
            return false;
        }

        return URL_PATTERN.matcher(url).matches();
    }

    /**
     * 안전한 텍스트인지 검증 (특수문자 제한)
     * 
     * @param text 검증할 텍스트
     * @return 안전하면 true
     */
    public boolean isSafeText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return true;
        }

        return SAFE_TEXT_PATTERN.matcher(text).matches();
    }

    /**
     * 숫자만 포함되어 있는지 검증
     * 
     * @param value 검증할 문자열
     * @return 숫자만 있으면 true
     */
    public boolean isNumeric(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        return value.matches("^[0-9]+$");
    }

    /**
     * 길이 범위 검증
     * 
     * @param value     검증할 문자열
     * @param minLength 최소 길이
     * @param maxLength 최대 길이
     * @return 범위 내이면 true
     */
    public boolean isValidLength(String value, int minLength, int maxLength) {
        if (value == null) {
            return false;
        }

        int length = value.length();
        if (length < minLength || length > maxLength) {
            log.warn("🚫 길이 제한 초과: length={}, min={}, max={}", length, minLength, maxLength);
            return false;
        }

        return true;
    }

    /**
     * 비밀번호 강도 검증
     * 영문, 숫자, 특수문자 포함, 8-20자
     * 
     * @param password 검증할 비밀번호
     * @return 유효하면 true
     */
    public boolean isValidPassword(String password) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        // 길이 제한 (8-20자)
        if (password.length() < 8 || password.length() > 20) {
            log.warn("🚫 비밀번호 길이 제한: length={}", password.length());
            return false;
        }

        // 영문 포함 여부
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        // 숫자 포함 여부
        boolean hasDigit = password.matches(".*[0-9].*");
        // 특수문자 포함 여부
        boolean hasSpecial = password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*");

        if (!hasLetter || !hasDigit) {
            log.warn("🚫 비밀번호 강도 부족: hasLetter={}, hasDigit={}, hasSpecial={}",
                    hasLetter, hasDigit, hasSpecial);
            return false;
        }

        return true;
    }

    /**
     * 이메일 마스킹 (로깅용)
     * test@example.com -> t***@example.com
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }

        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];

        if (local.length() <= 1) {
            return "*@" + domain;
        }

        return local.charAt(0) + "***@" + domain;
    }

    /**
     * 전화번호 마스킹 (로깅용)
     * 010-1234-5678 -> 010-****-5678
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 8) {
            return "***";
        }

        String cleaned = phone.replaceAll("-", "");
        if (cleaned.length() == 11) {
            return cleaned.substring(0, 3) + "-****-" + cleaned.substring(7);
        } else if (cleaned.length() == 10) {
            return cleaned.substring(0, 3) + "***" + cleaned.substring(6);
        }

        return "***";
    }

    /**
     * 공백 제거 및 트림
     */
    public String sanitizeWhitespace(String value) {
        if (value == null) {
            return null;
        }

        // 양쪽 공백 제거
        String trimmed = value.trim();

        // 연속된 공백을 하나로
        trimmed = trimmed.replaceAll("\\s+", " ");

        return trimmed;
    }
}
