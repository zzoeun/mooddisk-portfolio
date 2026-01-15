package com.astro.mood.web.dto.auth;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInfoRequest {
    private Integer userIdx;

    @NotEmpty(message = "닉네임은 필수입니다.")
    private String nickname;

    private String phone;

    // 추가 프로필 정보
    private String bio;

}
