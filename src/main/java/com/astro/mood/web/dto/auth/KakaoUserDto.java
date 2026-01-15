package com.astro.mood.web.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

public class KakaoUserDto {

    @Getter
    @Setter
    public static class OAuthToken {
        private String access_token;
        private String token_type;
        private String refresh_token;
        private int expires_in;
        private String scope;
        private int refresh_token_expires_in;
    }

    @Getter
    @Setter
    public static class KakaoProfile {
        private Long id;
        private String connected_at;

        private Properties properties;

        @JsonProperty("kakao_account")
        private KakaoAccount kakaoAccount;

        @Getter
        @Setter
        public static class Properties {
            private String nickname;
            private String profile_image;
            private String thumbnail_image;
        }

        @Getter
        @Setter
        public static class KakaoAccount {
            @JsonProperty("profile_nickname_needs_agreement")
            private boolean profileNicknameNeedsAgreement;

            @JsonProperty("profile_image_needs_agreement")
            private boolean profileImageNeedsAgreement;
            private Profile profile;
            private String Email;


            @Getter
            @Setter
            public static class Profile {
                private String nickname;

                @JsonProperty("thumbnail_image_url")
                private String thumbnailImageUrl;

                @JsonProperty("profile_image_url")
                private String profileImageUrl;

                private boolean isDefaultImage;
                private boolean isDefaultNickname;
            }
        }
    }
}
