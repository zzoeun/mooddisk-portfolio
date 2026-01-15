package com.astro.mood.data.repository.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.entity.user.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface UserTokenRepository extends JpaRepository<UserToken, Integer> {

    UserToken findByUser(User user);

    @Modifying
    @Query("UPDATE UserToken ut SET ut.refreshToken = :refreshToken, ut.expiresAt = :expiresAt WHERE ut.tokenIdx = :tokenIdx")
    void updateUserTokenByTokenIdx(@Param("tokenIdx") Integer tokenIdx,
            @Param("refreshToken") String refreshToken,
            @Param("expiresAt") LocalDateTime expiresAt);

    // 사용자 토큰 삭제 (회원탈퇴 시)
    @Modifying
    @Query("DELETE FROM UserToken ut WHERE ut.user.userIdx = :userIdx")
    void deleteByUserIdx(@Param("userIdx") Integer userIdx);

}
