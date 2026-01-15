package com.astro.mood.web.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;


@Component
@Slf4j
public class RequestTimeLoggingInterceptor implements HandlerInterceptor {

    // 요청이 처리되기 전에 호출되는 메서드
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler) throws Exception {
        long startTime = System.currentTimeMillis();// 요청 처리 시작 시간을 밀리초 단위로 기록
        request.setAttribute("requestStartTime", startTime); // 요청 객체에 시작 시간 저장
        return true; // 다음 인터셉터 또는 핸들러로 요청을 계속 진행
    }

    // 요청 처리가 완료된 후 호출되는 메서드
    @Override
    public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull Object handler, @Nullable Exception ex) throws Exception {
        long startTime = (Long) request.getAttribute("requestStartTime"); // 요청 객체에서 시작 시간을 가져옴
        long endTime = System.currentTimeMillis(); // 현재 시간을 가져와서 요청 처리 종료 시간을 기록
        long executeTIme = endTime - startTime;// 요청 처리에 소요된 시간 계산

        // 요청 메서드, URI, 실행 시간을 로그로 기록
        log.info("{} {} executed in {} ms", request.getMethod(), request.getRequestURI(), executeTIme);
    }
}