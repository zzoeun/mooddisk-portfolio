package com.astro.mood.service.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class CustomException extends RuntimeException {
    private final ErrorCode errorCode;

    public String getMessage() {
        return errorCode.getMessage();
    }

    /**
     * 프로덕션 환경에서 일반화된 에러 메시지 반환
     */
    public String getProductionSafeMessage() {
        // 프로덕션 환경에서는 일반적인 메시지만 반환
        if (isProductionProfile()) {
            return getGeneralizedMessage();
        }
        return errorCode.getMessage();
    }

    /**
     * 프로덕션 환경에서 사용할 일반화된 메시지
     */
    private String getGeneralizedMessage() {
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
        // Environment를 직접 주입할 수 없으므로 시스템 프로퍼티로 확인
        String activeProfile = System.getProperty("spring.profiles.active");
        return "prod".equals(activeProfile) || "production".equals(activeProfile);
    }
}