package com.astro.mood.web.dto;


import java.util.List;

public record PaginatedResponse<T>(
        List<T> items,         // 데이터 목록
        boolean hasNextPage,   // 다음 페이지 여부
        Integer nextCursor        // 다음 페이지를 위한 커서
) {
    public static <T> PaginatedResponse<T> of(List<T> items, boolean hasNextPage, Integer nextCursor) {
        return new PaginatedResponse<>(items, hasNextPage, nextCursor);
    }
}