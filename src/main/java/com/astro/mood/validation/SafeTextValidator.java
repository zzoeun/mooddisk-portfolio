package com.astro.mood.validation;

import com.astro.mood.utils.XssProtectionUtil;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * SafeText 어노테이션 검증 구현체
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SafeTextValidator implements ConstraintValidator<SafeText, String> {

    private final XssProtectionUtil xssProtectionUtil;

    private int maxLength;
    private boolean checkXss;
    private boolean checkSqlInjection;
    private boolean checkPathTraversal;

    @Override
    public void initialize(SafeText constraintAnnotation) {
        this.maxLength = constraintAnnotation.maxLength();
        this.checkXss = constraintAnnotation.checkXss();
        this.checkSqlInjection = constraintAnnotation.checkSqlInjection();
        this.checkPathTraversal = constraintAnnotation.checkPathTraversal();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // null이거나 빈 문자열은 허용 (@NotNull과 함께 사용)
        if (value == null || value.isEmpty()) {
            return true;
        }

        // 1. 길이 검증
        if (maxLength > 0 && value.length() > maxLength) {
            log.warn("🚫 문자열 길이 초과: length={}, max={}", value.length(), maxLength);
            updateMessage(context, String.format("최대 %d자까지 입력 가능합니다", maxLength));
            return false;
        }

        // 2. XSS 검증
        if (checkXss && xssProtectionUtil.containsXss(value)) {
            log.warn("🚫 XSS 패턴 감지: value={}",
                    value.length() > 50 ? value.substring(0, 50) + "..." : value);
            updateMessage(context, "입력값에 허용되지 않은 스크립트가 포함되어 있습니다");
            return false;
        }

        // 3. SQL Injection 검증
        if (checkSqlInjection && xssProtectionUtil.containsSqlInjection(value)) {
            log.warn("🚫 SQL Injection 패턴 감지: value={}",
                    value.length() > 50 ? value.substring(0, 50) + "..." : value);
            updateMessage(context, "입력값에 허용되지 않은 패턴이 포함되어 있습니다");
            return false;
        }

        // 4. Path Traversal 검증
        if (checkPathTraversal && xssProtectionUtil.containsPathTraversal(value)) {
            log.warn("🚫 Path Traversal 패턴 감지: value={}", value);
            updateMessage(context, "입력값에 허용되지 않은 경로가 포함되어 있습니다");
            return false;
        }

        return true;
    }

    /**
     * 에러 메시지 업데이트
     */
    private void updateMessage(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message)
                .addConstraintViolation();
    }
}
