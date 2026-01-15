package com.astro.mood.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Component
@Slf4j
public class EncryptionUtils {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // GCM 표준 IV 길이
    private static final int GCM_TAG_LENGTH = 16; // GCM 인증 태그 길이

    @Value("${aws.secrets.encryption-key-id}")
    private String secretId;

    private final SecretsManagerClient secretsManagerClient;

    public EncryptionUtils() {
        this.secretsManagerClient = SecretsManagerClient.builder()
                .region(Region.AP_NORTHEAST_2)
                .build();
    }

    /**
     * AWS Secrets Manager에서 암호화 키를 가져옵니다.
     */
    private String getEncryptionKey() {
        try {
            GetSecretValueRequest request = GetSecretValueRequest.builder()
                    .secretId(secretId)
                    .build();

            GetSecretValueResponse response = secretsManagerClient.getSecretValue(request);
            return response.secretString();

        } catch (Exception e) {
            log.error("암호화 키 조회 실패: secretId={}, error={}", secretId, e.getMessage(), e);
            throw new RuntimeException("암호화 키 조회 실패", e);
        }
    }

    /**
     * 텍스트를 GCM 방식으로 암호화합니다.
     *
     * @param plainText 암호화할 텍스트
     * @param userId    사용자 ID (AAD용)
     * @return GCMEncryptionResult (ciphertext||tag, IV)
     */
    public GCMEncryptionResult encryptGCM(String plainText, Integer userId) {
        if (plainText == null || plainText.isEmpty()) {
            return new GCMEncryptionResult(plainText, null);
        }

        try {
            // AWS Secrets Manager에서 키 가져오기
            String encryptionKey = getEncryptionKey();

            // Base64로 인코딩된 키를 디코딩
            byte[] decodedKey = Base64.getDecoder().decode(encryptionKey);
            SecretKeySpec secretKey = new SecretKeySpec(decodedKey, ALGORITHM);

            // 랜덤 IV 생성 (CSPRNG 사용)
            byte[] iv = new byte[GCM_IV_LENGTH];
            SecureRandom.getInstanceStrong().nextBytes(iv);

            // GCM 모드로 암호화
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            // AAD (Additional Authenticated Data) 설정 (userId만 사용)
            String aadData = String.format("userId:%d", userId);
            cipher.updateAAD(aadData.getBytes(StandardCharsets.UTF_8));

            // 암호화 (ciphertext||tag 자동 생성)
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            return new GCMEncryptionResult(
                    Base64.getEncoder().encodeToString(encryptedBytes),
                    Base64.getEncoder().encodeToString(iv));

        } catch (Exception e) {
            log.error("GCM 암호화 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("GCM 암호화 실패", e);
        }
    }

    /**
     * GCM 방식으로 암호화된 텍스트를 복호화합니다.
     * 하위 호환성을 위해 두 가지 AAD 방식을 시도합니다.
     *
     * @param encryptedData ciphertext||tag (Base64)
     * @param iv            초기화 벡터 (Base64)
     * @param userId        사용자 ID (AAD용)
     * @param diaryId       일기 ID (하위 호환성용, null 가능)
     * @return 복호화된 원본 텍스트
     */
    public String decryptGCM(String encryptedData, String iv, Integer userId, Integer diaryId) {
        if (encryptedData == null || encryptedData.isEmpty() || iv == null) {
            throw new RuntimeException("복호화 실패: 필수 데이터 누락");
        }

        // AWS Secrets Manager에서 키 가져오기
        String encryptionKey = getEncryptionKey();

        // Base64로 인코딩된 키를 디코딩
        byte[] decodedKey = Base64.getDecoder().decode(encryptionKey);
        SecretKeySpec secretKey = new SecretKeySpec(decodedKey, ALGORITHM);

        // Base64 디코딩
        byte[] ivBytes = Base64.getDecoder().decode(iv);
        byte[] encryptedBytes = Base64.getDecoder().decode(encryptedData);

        // 1. 새로운 방식 시도 (userId만 사용)
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, ivBytes);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            String aadData = String.format("userId:%d", userId);
            cipher.updateAAD(aadData.getBytes(StandardCharsets.UTF_8));

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            log.info("GCM 복호화 성공 (새로운 방식): userId={}", userId);
            return new String(decryptedBytes, StandardCharsets.UTF_8);

        } catch (Exception e1) {
            log.warn("새로운 방식 복호화 실패, 하위 호환성 시도: userId={}, diaryId={}", userId, diaryId);

            // 2. 기존 방식 시도 (userId,diaryId 사용) - 하위 호환성
            if (diaryId != null) {
                try {
                    Cipher cipher = Cipher.getInstance(TRANSFORMATION);
                    GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, ivBytes);
                    cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

                    String aadData = String.format("userId:%d,diaryId:%d", userId, diaryId);
                    cipher.updateAAD(aadData.getBytes(StandardCharsets.UTF_8));

                    byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
                    log.info("GCM 복호화 성공 (기존 방식): userId={}, diaryId={}", userId, diaryId);
                    return new String(decryptedBytes, StandardCharsets.UTF_8);

                } catch (Exception e2) {
                    log.error("기존 방식 복호화도 실패: userId={}, diaryId={}, error={}", userId, diaryId, e2.getMessage());
                }
            }

            log.error("GCM 복호화 완전 실패: userId={}, diaryId={}, error={}", userId, diaryId, e1.getMessage());
            throw new RuntimeException("GCM 복호화 실패", e1);
        }
    }

    /**
     * GCM 방식으로 암호화된 텍스트를 복호화합니다. (diaryId 없이)
     *
     * @param encryptedData ciphertext||tag (Base64)
     * @param iv            초기화 벡터 (Base64)
     * @param userId        사용자 ID (AAD용)
     * @return 복호화된 원본 텍스트
     */
    public String decryptGCM(String encryptedData, String iv, Integer userId) {
        return decryptGCM(encryptedData, iv, userId, null);
    }

    /**
     * GCM 암호화 결과를 담는 클래스
     */
    public static class GCMEncryptionResult {
        private final String encryptedData; // ciphertext||tag
        private final String iv;

        public GCMEncryptionResult(String encryptedData, String iv) {
            this.encryptedData = encryptedData;
            this.iv = iv;
        }

        public String getEncryptedData() {
            return encryptedData;
        }

        public String getIv() {
            return iv;
        }
    }
}
