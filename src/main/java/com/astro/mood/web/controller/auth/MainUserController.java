package com.astro.mood.web.controller.auth;

import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.auth.AuthService;
import com.astro.mood.service.auth.MainUserService;
import com.astro.mood.web.dto.ApiResponse;
import com.astro.mood.web.dto.auth.MainUserInfoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


@RestController()
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/main/user")
public class MainUserController {
    private final AuthService authService;
    private final MainUserService mainUserService;

    //유저정보 메인페이지
    @GetMapping("/{loginIdx}")
    public ResponseEntity<ApiResponse<?>> getUserInfoForMain(@PathVariable Integer loginIdx, @AuthenticationPrincipal CustomUserDetails userDetails) {
        // 유저 검증
        authService.validateUser(userDetails, loginIdx);
        try{
            MainUserInfoResponse result = mainUserService.getUserInfo(loginIdx);
            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("유저정보 error : {}", e.getMessage(), e);
            throw e;
        }
    }

}
