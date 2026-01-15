package com.astro.mood.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * 안전한 텍스트 검증 어노테이션
 * XSS, SQL Injection, Path Traversal 패턴을 검사
 * 
 * 사용 예:
 * 
 * @SafeText
 *           private String content;
 * 
 * @SafeText(maxLength = 100, message = "닉네임이 안전하지 않습니다")
 *                     private String nickname;
 */
@Documented
@Constraint(validatedBy = SafeTextValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface SafeText {

    String message() default "입력값에 허용되지 않은 패턴이 포함되어 있습니다";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /**
     * 최대 길이 제한 (0 = 제한 없음)
     */
    int maxLength() default 0;

    /**
     * XSS 검증 활성화
     */
    boolean checkXss() default true;

    /**
     * SQL Injection 검증 활성화
     */
    boolean checkSqlInjection() default true;

    /**
     * Path Traversal 검증 활성화
     */
    boolean checkPathTraversal() default true;
}
