package com.astro.mood.web.dto.auth;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignRequest {
    private String email;
    @NotEmpty(message = "닉네임은 필수입니다.")
    private String nickName;
    private MultipartFile profileImage;
    private String phone;

    private String oauthProvider;
    private String oauthId;

    private String accessToken;
    private String refreshToken;
    private String expiresAt;
}
