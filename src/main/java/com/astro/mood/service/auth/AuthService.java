package com.astro.mood.service.auth;

import com.astro.mood.data.entity.user.User;
import com.astro.mood.data.repository.auth.AuthRepository;
import com.astro.mood.security.login.CustomUserDetails;
import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.service.s3Image.AwsS3Service;
import com.astro.mood.web.dto.auth.UserInfoRequest;
import com.astro.mood.web.dto.auth.UserInfoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final AuthRepository authRepository;
    private final AwsS3Service awsS3Service;

    // 유저 검증 메서드
    public void validateUser(CustomUserDetails userDetails, Integer loginIdx) {
        if (userDetails == null) {
            throw new CustomException(ErrorCode.UNAUTHORIZED);
        }
        if (loginIdx > 0) {
            if (!userDetails.getUserIdx().equals(loginIdx)) {
                throw new CustomException(ErrorCode.FORBIDDEN);
            }
        }
    }

    // 사용자 찾기 메서드
    public User findUserByIdOrThrow(Integer userIdx) {
        return authRepository.findById(userIdx)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    // 유저정보 수정
    @Transactional(transactionManager = "tmJpa")
    public UserInfoResponse putUserInfo(UserInfoRequest userInfoRequest, String newImageUrl) {
        User user = findUserByIdOrThrow(userInfoRequest.getUserIdx());
        user.updateProfileImage(newImageUrl);
        user.updateNickname(userInfoRequest.getNickname());
        user.updatePhone(userInfoRequest.getPhone());

        // 추가 프로필 정보 업데이트
        user.updateBio(userInfoRequest.getBio());

        UserInfoResponse response = UserInfoResponse.from(user);
        // 프리사인드 URL 생성
        if (response.getProfileImage() != null) {
            response.setProfileImage(awsS3Service.generatePresignedUrl(response.getProfileImage()));
        }
        return response;
    }

    // 유저정보 가져오기
    public UserInfoResponse getUserInfo(Integer loginIdx) {
        User user = findUserByIdOrThrow(loginIdx);
        UserInfoResponse response = UserInfoResponse.from(user);
        // 프리사인드 URL 생성
        if (response.getProfileImage() != null) {
            response.setProfileImage(awsS3Service.generatePresignedUrl(response.getProfileImage()));
        }
        return response;
    }

    // 회원탈퇴 (소프트 삭제)
    @Transactional(transactionManager = "tmJpa")
    public void withdrawUser(Integer loginIdx) {
        User user = findUserByIdOrThrow(loginIdx);

        if (user.getIsDeleted()) {
            throw new CustomException(ErrorCode.WITHDRAW_FORBIDDEN);
        }

        user.deleteUser();
        authRepository.save(user);
    }

}
