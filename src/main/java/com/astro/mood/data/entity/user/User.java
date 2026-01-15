package com.astro.mood.data.entity.user;

import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.web.dto.auth.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Entity
@DynamicInsert
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@Table(name = "user")
public class User {
    @Id
    @Column(name = "user_idx")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userIdx;

    @Column(name = "email")
    private String email;
    @Column(name = "nickname", nullable = false)
    @NotEmpty(message = "닉네임은 필수입니다.")
    private String nickname;
    @Column(name = "profile_image")
    private String profileImage;
    @Column(name = "phone", columnDefinition = "CHAR(11)")
    private String phone;
    @Column(name = "oauth_provider", nullable = false)
    private String oauthProvider;

    // 추가 프로필 정보
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "oauth_id", nullable = false)
    private String oauthId;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "role")
    private String role;

    // 유저 admin 권한 체크
    public Set<UserRole> getAuthorities() {
        if (role != null && role.equals("ROLE_ADMIN")) {
            return Set.of(UserRole.ROLE_ADMIN);
        }
        return Set.of(UserRole.ROLE_USER);
    }

    // 회원탈퇴
    public void deleteUser() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    // 계정 복구
    public void recoverAccount() {
        this.isDeleted = false;
        this.deletedAt = null;
    }

    // 유저 정보 수정 책임분리 추가 ==============
    public void updateProfileImage(String newImageUrl) {
        if (newImageUrl != null) {
            this.profileImage = newImageUrl;
        }
    }

    public void updateNickname(String newName) {
        if (newName != null && !newName.isEmpty()) {
            if (newName.length() <= 10) {
                this.nickname = newName;
            } else {
                throw new CustomException(ErrorCode.INVALID_VALUE_NICKNAME);
            }
        }
    }

    public void updatePhone(String newPhone) {
        if (newPhone.isEmpty()) {
            this.phone = null;
        } else {
            if (newPhone.length() == 11) {
                this.phone = newPhone;
            } else {
                throw new CustomException(ErrorCode.INVALID_VALUE_PHONE);
            }
        }
    }

    public void updateEmail(String newEmail) {
        if (newEmail != null && !newEmail.isEmpty()) {
            this.email = newEmail;
        }
    }

    // 추가 프로필 정보 업데이트 메소드들
    public void updateBio(String newBio) {
        this.bio = newBio;
    }

}
