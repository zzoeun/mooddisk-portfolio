package com.astro.mood.web.dto.auth;

import lombok.Getter;

import java.util.Set;

@Getter
public class CustomUserInfoDto  {
    private String nickname;
    private int userIdx;
    private Set<UserRole> authorities;
}
