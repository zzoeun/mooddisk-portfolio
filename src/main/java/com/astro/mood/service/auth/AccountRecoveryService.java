package com.astro.mood.service.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountRecoveryService {

    private final AuthRepository authRepository;

    /**
     * 계정 복구 가능 여부 확인
     */
    public boolean canRecoverAccount(String oauthId, String oauthProvider) {
        Optional<User> userOpt = authRepository.findUserByOauthIdAndOauthProviderAndIsDeleted(
                oauthId, oauthProvider, true);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        LocalDateTime deletedAt = user.getDeletedAt();

        if (deletedAt == null) {
            return false;
        }

        // 30일 이내인지 확인
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return deletedAt.isAfter(thirtyDaysAgo);
    }

    /**
     * 계정 복구 실행
     */
    @Transactional(transactionManager = "tmJpa")
    public User recoverAccount(String oauthId, String oauthProvider) {
        Optional<User> userOpt = authRepository.findUserByOauthIdAndOauthProviderAndIsDeleted(
                oauthId, oauthProvider, true);

        if (userOpt.isEmpty()) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        User user = userOpt.get();

        // 복구 가능 기간 확인
        if (!canRecoverAccount(oauthId, oauthProvider)) {
            throw new CustomException(ErrorCode.WITHDRAW_FORBIDDEN);
        }

        // 계정 복구
        user.recoverAccount();
        User recoveredUser = authRepository.save(user);

        log.info("계정 복구 완료 - userIdx: {}, oauthId: {}",
                recoveredUser.getUserIdx(), oauthId);

        return recoveredUser;
    }

    /**
     * 복구 가능한 계정 정보 조회
     */
    public User getRecoverableAccount(String oauthId, String oauthProvider) {
        Optional<User> userOpt = authRepository.findUserByOauthIdAndOauthProviderAndIsDeleted(
                oauthId, oauthProvider, true);

        if (userOpt.isEmpty() || !canRecoverAccount(oauthId, oauthProvider)) {
            throw new CustomException(ErrorCode.USER_NOT_FOUND);
        }

        return userOpt.get();
    }
}