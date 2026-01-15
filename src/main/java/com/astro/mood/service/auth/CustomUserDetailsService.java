package com.astro.mood.service.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.user.UserToken;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.data.repository.auth.UserTokenRepository;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.web.dto.auth.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@RequiredArgsConstructor
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AuthRepository authRepository;
    private final UserTokenRepository userTokenRepository;
    private final AccountRecoveryService accountRecoveryService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User userPrincipal = authRepository.findUserByEmailAndIsDeleted(email, false)
                .orElseThrow(() -> new UsernameNotFoundException("email 에 해당하는 UserPrincipal가 없습니다"));

        Set<UserRole> roles = userPrincipal.getAuthorities();

        return CustomUserDetails.builder()
                .userIdx(userPrincipal.getUserIdx())
                .email(userPrincipal.getEmail())
                .profileImage(userPrincipal.getProfileImage())
                .nickname(userPrincipal.getNickname())
                .authorities(roles)
                .role(userPrincipal.getRole())
                .build();

    }

    public UserDetails loadUserByUserIdx(Integer userIdx) throws UsernameNotFoundException {
        User userPrincipal = authRepository.findUserByUserIdxAndIsDeleted(userIdx, false)
                .orElseThrow(() -> new UsernameNotFoundException("email 에 해당하는 UserPrincipal가 없습니다"));

        Set<UserRole> roles = userPrincipal.getAuthorities();

        return CustomUserDetails.builder()
                .userIdx(userPrincipal.getUserIdx())
                .email(userPrincipal.getEmail())
                .profileImage(userPrincipal.getProfileImage())
                .nickname(userPrincipal.getNickname())
                .authorities(roles)
                .role(userPrincipal.getRole())
                .build();

    }

    // CustomUserDetails 생성
    public UserDetails loadUser(Map<String, Object> userInfo, String provider) throws UsernameNotFoundException {
        String email;
        String providerId;
        String picture;
        String name;

        if (provider.equals("GOOGLE")) {
            email = userInfo.get("email").toString();
            providerId = userInfo.get("sub").toString();
            picture = userInfo.get("picture").toString();
            name = userInfo.get("name").toString();
        } else if (provider.equals("KAKAO")) {
            email = userInfo.get("email") != null ? userInfo.get("email").toString() : "";
            providerId = userInfo.get("sub").toString(); // Kakao ID
            picture = userInfo.get("picture") != null ? userInfo.get("picture").toString() : "";
            name = userInfo.get("name") != null ? userInfo.get("name").toString() : "사용자" + providerId.substring(0, 8);
        } else if (provider.equals("APPLE")) {
            email = userInfo.get("email") != null ? userInfo.get("email").toString() : "";
            providerId = userInfo.get("sub").toString(); // Apple ID
            picture = ""; // Apple은 프로필 이미지를 제공하지 않음
            name = userInfo.get("name") != null ? userInfo.get("name").toString() : "기록자";
        } else {
            throw new UsernameNotFoundException("Unsupported OAuth provider: " + provider);
        }

        // 1. 먼저 활성 계정 확인
        Optional<User> activeUser = authRepository.findUserByOauthIdAndOauthProviderAndIsDeleted(providerId, provider,
                false);

        User userPrincipal;
        if (activeUser.isPresent()) {
            // 활성 계정이 있으면 사용
            userPrincipal = activeUser.get();
        } else {
            // 2. 탈퇴된 계정 확인
            Optional<User> deletedUser = authRepository.findUserByOauthIdAndOauthProviderAndIsDeleted(providerId,
                    provider, true);

            if (deletedUser.isPresent() && accountRecoveryService.canRecoverAccount(providerId, provider)) {
                // 3. 30일 이내 탈퇴된 계정이면 복구
                try {
                    userPrincipal = accountRecoveryService.recoverAccount(providerId, provider);
                    // 프로필 정보 업데이트 (OAuth에서 받은 최신 정보로)
                    userPrincipal.updateProfileImage(picture);
                    userPrincipal.updateNickname(name);
                    if (email != null && !email.isEmpty()) {
                        userPrincipal.updateEmail(email);
                    }
                    authRepository.save(userPrincipal);
                } catch (Exception e) {
                    // 복구 실패 시 새 계정 생성
                    userPrincipal = createNewUser(email, name, picture, providerId, provider);
                }
            } else {
                // 4. 탈퇴된 계정이 없거나 30일 경과했으면 새 계정 생성
                userPrincipal = createNewUser(email, name, picture, providerId, provider);
            }
        }

        return CustomUserDetails.builder()
                .userIdx(userPrincipal.getUserIdx())
                .email(userPrincipal.getEmail())
                .nickname(userPrincipal.getNickname())
                .profileImage(userPrincipal.getProfileImage())
                .authorities(userPrincipal.getAuthorities())
                .role(userPrincipal.getRole())
                .build();
    }

    // 유저토큰 가져오기
    public UserToken findUserToken(Integer userIdx) {
        User user = User.builder().userIdx(userIdx).build();
        return userTokenRepository.findByUser(user);
    }

    // 리프레시토큰 생성/업데이트
    @Transactional(transactionManager = "tmJpa")
    public void saveRefreshToken(UserToken newRefreshToken) {
        UserToken findUserToken = userTokenRepository.findByUser(newRefreshToken.getUser());
        if (findUserToken == null) {
            userTokenRepository.save(newRefreshToken);
        } else {
            userTokenRepository.updateUserTokenByTokenIdx(newRefreshToken.getTokenIdx(),
                    newRefreshToken.getRefreshToken(), newRefreshToken.getExpiresAt());
        }
    }

    /**
     * 새 사용자 생성 헬퍼 메서드
     */
    private User createNewUser(String email, String name, String picture, String providerId, String provider) {
        User newUser = User.builder()
                .email(email)
                .nickname(name)
                .role("ROLE_USER")
                .isDeleted(false)
                .profileImage(picture)
                .oauthId(providerId)
                .oauthProvider(provider)
                .build();

        return authRepository.save(newUser);
    }

}