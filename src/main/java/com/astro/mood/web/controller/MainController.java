package com.astro.mood.web.controller;


import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MainController {
    // 루트 경로 요청 처리
    @GetMapping({"/", "/error"})
    public String indexPage(HttpServletRequest request, HttpServletResponse response) {
        Cookie refreshTokenCookie = new Cookie("refreshToken", null);  // 쿠키 값을 null로 설정
        refreshTokenCookie.setMaxAge(0);  // 남은 만료시간을 0으로 설정
        response.addCookie(refreshTokenCookie);
        return "index.html";// index.html 파일을 반환
    }

}
