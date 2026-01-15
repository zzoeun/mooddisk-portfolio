package com.astro.mood.service.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.service.diary.DiaryService;
import com.astro.mood.web.dto.auth.MainUserInfoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MainUserService {
    private final AuthService authService;
    private final DiaryService diaryService;

    // 유저정보 가져오기
    public MainUserInfoResponse getUserInfo(Integer loginIdx) {
        User user = authService.findUserByIdOrThrow(loginIdx);
        int diaryCount = diaryService.getCountDiaryByUserIdx(loginIdx); // 작성한 일기 수

        return new MainUserInfoResponse(user, diaryCount);
    }

}
