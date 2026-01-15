package com.astro.mood.data.repository.auth;

import com.astro.mood.data.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AuthRepository extends JpaRepository<User, Integer> {

    Optional<User> findUserByOauthIdAndOauthProviderAndIsDeleted(String oauthId, String oauthProvider,
            Boolean isDeleted);

    Optional<User> findUserByEmailAndIsDeleted(String email, Boolean isDeleted);

    Optional<User> findUserByUserIdxAndIsDeleted(Integer userIdx, Boolean isDeleted);

    // 30일 경과한 탈퇴 사용자 조회
    List<User> findByIsDeletedTrueAndDeletedAtBefore(LocalDateTime date);
}
