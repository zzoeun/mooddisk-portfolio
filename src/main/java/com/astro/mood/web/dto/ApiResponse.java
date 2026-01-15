package com.astro.mood.web.dto;

import com.astro.mood.service.exception.CustomException;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;

public record ApiResponse<T>(
        @JsonIgnore //JSON 직렬화 시 포함되지 않도록 함
        HttpStatus httpStatus,
        boolean isSuccess,
        @Nullable T data,
        @Nullable ExceptionDto error
) {

    //성공적인 응답
    public static <T> ApiResponse<T> ok(@Nullable final T data) {
        return new ApiResponse<>(HttpStatus.OK, true, data, null);
    }

    //생성 성공 응답
    public static <T> ApiResponse<T> created(@Nullable final T data) {
        return new ApiResponse<>(HttpStatus.CREATED, true, data, null);
    }

    //실패한 응답
    public static <T> ApiResponse<T> fail(final CustomException e) {
        return new ApiResponse<>(e.getErrorCode().getHttpStatus(), false, null, ExceptionDto.of(e.getErrorCode()));
    }
}