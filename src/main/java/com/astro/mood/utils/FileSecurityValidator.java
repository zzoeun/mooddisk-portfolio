package com.astro.mood.utils;

import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 파일 업로드 보안 검증 유틸리티
 * - 파일 시그니처(매직 넘버) 검증
 * - 이중 확장자 공격 방지
 * - 파일 크기 제한
 * - 메타데이터 검증
 */
@Component
@Slf4j
public class FileSecurityValidator {

    // 파일 시그니처 (매직 넘버) - 실제 파일 내용으로 파일 형식 판별
    private static final Map<String, byte[]> FILE_SIGNATURES = Map.of(
            "jpg", new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            "jpeg", new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            "png", new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A },
            "gif", new byte[] { 0x47, 0x49, 0x46, 0x38 });

    // 허용된 MIME 타입
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif");

    // 허용된 확장자
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "gif");

    // 금지된 확장자 (이중 확장자 공격 방지)
    private static final List<String> FORBIDDEN_EXTENSIONS = Arrays.asList(
            "php", "jsp", "asp", "aspx", "exe", "sh", "bat", "cmd",
            "js", "html", "htm", "xml", "svg", "swf", "xhtml");

    // 최대 파일 크기 (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    // 최대 이미지 해상도
    private static final int MAX_IMAGE_WIDTH = 8000;
    private static final int MAX_IMAGE_HEIGHT = 8000;

    /**
     * 종합 파일 보안 검증
     *
     * @param file 업로드할 파일
     * @throws CustomException 보안 검증 실패 시
     */
    public void validateFile(MultipartFile file) {
        try {
            log.info("파일 보안 검증 시작: filename={}, size={}, contentType={}",
                    file.getOriginalFilename(), file.getSize(), file.getContentType());

            // 1. Null 및 빈 파일 체크
            validateNotEmpty(file);

            // 2. 파일 크기 검증
            validateFileSize(file);

            // 3. 파일명 검증
            String filename = validateFilename(file.getOriginalFilename());

            // 4. 확장자 검증
            String extension = validateExtension(filename);

            // 5. 이중 확장자 공격 검증
            validateDoubleExtension(filename);

            // 6. Content-Type 검증
            validateContentType(file.getContentType());

            // 7. 매직 넘버 검증 (실제 파일 내용)
            byte[] fileBytes = file.getBytes();
            validateMagicNumber(fileBytes, extension);

            // 8. 이미지 메타데이터 검증
            validateImageMetadata(fileBytes, filename);

            log.info("✅ 파일 보안 검증 통과: filename={}", filename);

        } catch (IOException e) {
            log.error("파일 읽기 오류: {}", e.getMessage());
            throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("파일 검증 중 예상치 못한 오류: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.FILE_UPLOAD_ERROR);
        }
    }

    /**
     * 1. Null 및 빈 파일 검증
     */
    private void validateNotEmpty(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            log.warn("🚫 빈 파일 업로드 시도");
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }
    }

    /**
     * 2. 파일 크기 검증
     */
    private void validateFileSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            log.warn("🚫 파일 크기 초과: size={}MB, max={}MB",
                    file.getSize() / 1024 / 1024, MAX_FILE_SIZE / 1024 / 1024);
            throw new CustomException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
    }

    /**
     * 3. 파일명 검증
     */
    private String validateFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            log.warn("🚫 파일명 없음");
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }

        // Path Traversal 공격 방지 (../ 또는 ..\)
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            log.warn("🚫 Path Traversal 공격 시도 감지: filename={}", originalFilename);
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // Null byte 공격 방지
        if (originalFilename.contains("\0")) {
            log.warn("🚫 Null byte 공격 시도 감지: filename={}", originalFilename);
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        return originalFilename;
    }

    /**
     * 4. 확장자 검증
     */
    private String validateExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            log.warn("🚫 파일 확장자 없음: filename={}", filename);
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }

        String extension = filename.substring(lastDotIndex + 1).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            log.warn("🚫 허용되지 않은 확장자: extension={}", extension);
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        return extension;
    }

    /**
     * 5. 이중 확장자 공격 검증
     * 예: image.php.jpg, script.jsp.png
     */
    private void validateDoubleExtension(String filename) {
        String[] parts = filename.split("\\.");

        // 확장자가 2개 이상인 경우 (파일명.확장자1.확장자2)
        if (parts.length > 2) {
            // 마지막 확장자를 제외한 모든 부분 검사
            for (int i = 1; i < parts.length - 1; i++) {
                String part = parts[i].toLowerCase();
                if (FORBIDDEN_EXTENSIONS.contains(part)) {
                    log.warn("🚫 이중 확장자 공격 시도 감지: filename={}, forbidden_ext={}",
                            filename, part);
                    throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
                }
            }
        }
    }

    /**
     * 6. Content-Type 검증
     */
    private void validateContentType(String contentType) {
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            log.warn("🚫 허용되지 않은 MIME 타입: contentType={}", contentType);
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }
    }

    /**
     * 7. 매직 넘버 검증 (파일 시그니처)
     * 실제 파일 내용이 확장자와 일치하는지 확인
     */
    private void validateMagicNumber(byte[] fileBytes, String extension) {
        if (fileBytes.length < 8) {
            log.warn("🚫 파일이 너무 작음: size={}", fileBytes.length);
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        byte[] expectedSignature = FILE_SIGNATURES.get(extension.toLowerCase());
        if (expectedSignature == null) {
            log.warn("🚫 알 수 없는 파일 형식: extension={}", extension);
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // 파일의 시작 바이트와 예상 시그니처 비교
        for (int i = 0; i < expectedSignature.length; i++) {
            if (fileBytes[i] != expectedSignature[i]) {
                log.warn("🚫 매직 넘버 불일치 - 파일 형식 위조 의심: extension={}, expected={}, actual={}",
                        extension,
                        bytesToHex(expectedSignature),
                        bytesToHex(Arrays.copyOf(fileBytes, Math.min(fileBytes.length, 8))));
                throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
            }
        }
    }

    /**
     * 8. 이미지 메타데이터 검증
     * ImageIO를 사용하여 실제로 유효한 이미지인지 확인
     */
    private void validateImageMetadata(byte[] fileBytes, String filename) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(fileBytes));

            if (image == null) {
                log.warn("🚫 유효하지 않은 이미지 파일: filename={}", filename);
                throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
            }

            // 이미지 해상도 검증
            int width = image.getWidth();
            int height = image.getHeight();

            if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
                log.warn("🚫 이미지 해상도 초과: filename={}, size={}x{}, max={}x{}",
                        filename, width, height, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT);
                throw new CustomException(ErrorCode.FILE_SIZE_EXCEEDED);
            }

            // 최소 해상도 검증 (너무 작은 이미지 차단)
            if (width < 10 || height < 10) {
                log.warn("🚫 이미지가 너무 작음: filename={}, size={}x{}", filename, width, height);
                throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
            }

            log.debug("이미지 메타데이터 검증 완료: filename={}, size={}x{}", filename, width, height);

        } catch (IOException e) {
            log.warn("🚫 이미지 파일 파싱 실패: filename={}, error={}", filename, e.getMessage());
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }
    }

    /**
     * 바이트 배열을 16진수 문자열로 변환 (디버깅용)
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X ", b));
        }
        return sb.toString().trim();
    }

    /**
     * 파일 확장자 추출 유틸리티
     */
    public String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDot = filename.lastIndexOf(".");
        if (lastDot == -1) {
            return "";
        }
        return filename.substring(lastDot + 1).toLowerCase();
    }
}
