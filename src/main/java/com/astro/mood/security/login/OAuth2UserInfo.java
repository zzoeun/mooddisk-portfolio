package com.astro.mood.security.login;

/**
 * 구글 로그인 뿐만 아니라 나중에 카카오, 네이버 등의 소셜 서비스 로그인도 진행할 것
 * 따라서 인터페이스를 추가해서 통일성 부여
 * */
public interface OAuth2UserInfo {
    String getProvider();
    String getProviderId();
    String getEmail();
    String getName();
}
