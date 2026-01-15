package com.astro.mood.web.dto.auth;

import com.astro.mood.data.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MainUserInfoResponse {
    private int userIdx;

    // 작성한 일기 수
    private int diaryCount;

    public MainUserInfoResponse(User user, int diaryCount) {
        this.userIdx = user.getUserIdx();
        this.diaryCount = diaryCount;
    }
}