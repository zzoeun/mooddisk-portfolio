package com.astro.mood.web.dto;

import com.astro.mood.service.exception.ErrorCode;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class ExceptionDto {
    @NotNull
    private final Integer code;

    @NotNull
    private final String message;

    public ExceptionDto(ErrorCode errorCode) {
        this.code = errorCode.getCode();
        this.message = getProductionSafeMessage(errorCode);
    }

    public static ExceptionDto of(ErrorCode errorCode) {
        return new ExceptionDto(errorCode);
    }

    /**
     * 프로덕션 환경에서 일반화된 에러 메시지 반환
     */
    private String getProductionSafeMessage(ErrorCode errorCode) {
        // 프로덕션 환경에서는 일반적인 메시지만 반환
        if (isProductionProfile()) {
            return getGeneralizedMessage(errorCode);
        }
        return errorCode.getMessage();
    }

    /**
     * 프로덕션 환경에서 사용할 일반화된 메시지
     */
    private String getGeneralizedMessage(ErrorCode errorCode) {
        switch (errorCode.getHttpStatus()) {
            case BAD_REQUEST:
                return "잘못된 요청입니다.";
            case UNAUTHORIZED:
                return "인증이 필요합니다.";
            case FORBIDDEN:
                return "접근 권한이 없습니다.";
            case NOT_FOUND:
                return "요청한 리소스를 찾을 수 없습니다.";
            case CONFLICT:
                return "요청 처리 중 충돌이 발생했습니다.";
            case INTERNAL_SERVER_ERROR:
            default:
                return "서버 오류가 발생했습니다.";
        }
    }

    /**
     * 현재 프로파일이 프로덕션인지 확인
     */
    private boolean isProductionProfile() {
        String activeProfile = System.getProperty("spring.profiles.active");
        return "prod".equals(activeProfile) || "production".equals(activeProfile);
    }
}