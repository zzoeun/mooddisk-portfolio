package com.astro.mood.web.advice;

import com.astro.mood.service.exception.CustomException;
import com.astro.mood.web.dto.ApiResponse;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.utils.LogMaskingUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private Environment environment;

    // 존재하지 않는 요청에 대한 예외
    @ExceptionHandler({ NoHandlerFoundException.class, HttpRequestMethodNotSupportedException.class })
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<?> handleNoPageFoundException(Exception e) {
        if (isProductionProfile()) {
            log.error("404 Error occurred - endpoint not found");
        } else {
            log.error("GlobalExceptionHandler catch NoHandlerFoundException : {}",
                    LogMaskingUtil.maskSensitiveInfo(e.getMessage()));
        }
        return ApiResponse.fail(new CustomException(ErrorCode.NOT_FOUND_END_POINT));
    }

    // 파일 업로드 크기 초과 예외 처리
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        if (isProductionProfile()) {
            log.error("File upload size exceeded");
        } else {
            log.error("File size exceeded: {}", LogMaskingUtil.maskSensitiveInfo(e.getMessage()));
        }
        return ApiResponse.fail(new CustomException(ErrorCode.FILE_SIZE_EXCEEDED));
    }

    // 런타임 예외 처리
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> handleRuntimeException(RuntimeException e) {
        if (isProductionProfile()) {
            log.error("Runtime error occurred");
        } else {
            log.error("Runtime error: {}", LogMaskingUtil.maskExceptionMessage(e.getMessage()));
        }
        return ApiResponse.fail(new CustomException(ErrorCode.INTERNAL_SERVER_ERROR));
    }

    // 커스텀 예외 처리
    @ExceptionHandler(CustomException.class)
    public ApiResponse<?> handleCustomException(CustomException e) {
        if (isProductionProfile()) {
            log.error("Custom exception occurred - ErrorCode: {}", e.getErrorCode().getCode());
        } else {
            log.error("handleCustomException() in GlobalExceptionHandler throw CustomException : {}",
                    LogMaskingUtil.maskSensitiveInfo(e.getMessage()));
        }
        return ApiResponse.fail(e);
    }

    // 필수 파라미터 검증 예외처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<?> handleValidationExceptions(MethodArgumentNotValidException e) {
        if (isProductionProfile()) {
            log.error("Validation error occurred");
        } else {
            log.error("handleException() in GlobalExceptionHandler throw Exception : {}",
                    LogMaskingUtil.maskSensitiveInfo(e.getMessage()));
            // 개발 환경에서만 스택 트레이스 출력
            if (!isProductionProfile()) {
                log.error("Stack trace: ", e);
            }
        }
        return ApiResponse.fail(new CustomException(ErrorCode.MISSING_REQUIRED_PARAMETER));
    }

    // 기본 예외 처리
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> handleException(Exception e) {
        // 의심스러운 경로는 WARN 레벨로 로깅 (보안 공격 시도로 간주)
        String message = e.getMessage();
        if (message != null && isSuspiciousPath(message)) {
            log.warn("Suspicious request detected: {}", LogMaskingUtil.maskExceptionMessage(message));
        } else if (isProductionProfile()) {
            log.error("Unexpected error occurred");
        } else {
            log.error("handleException() in GlobalExceptionHandler throw Exception : {}",
                    LogMaskingUtil.maskExceptionMessage(message));
            // 개발 환경에서만 스택 트레이스 출력
            if (!isProductionProfile()) {
                log.error("Stack trace: ", e);
            }
        }
        return ApiResponse.fail(new CustomException(ErrorCode.INTERNAL_SERVER_ERROR));
    }

    /**
     * 의심스러운 경로인지 확인
     */
    private boolean isSuspiciousPath(String path) {
        if (path == null) {
            return false;
        }
        String lowerPath = path.toLowerCase();
        return lowerPath.contains("phpunit") ||
               lowerPath.contains("eval-stdin") ||
               lowerPath.contains(".env") ||
               lowerPath.contains("containers/json") ||
               lowerPath.contains("vendor/") ||
               lowerPath.contains("wp-admin") ||
               lowerPath.contains("phpmyadmin");
    }

    /**
     * 현재 프로파일이 프로덕션인지 확인
     */
    private boolean isProductionProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("prod".equals(profile) || "production".equals(profile)) {
                return true;
            }
        }
        return false;
    }
}