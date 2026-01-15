package com.astro.mood.service.s3Image;

import com.astro.mood.service.exception.CustomException;
import com.astro.mood.service.exception.ErrorCode;
import com.astro.mood.utils.FileSecurityValidator;
import software.amazon.awssdk.services.s3.model.S3Exception;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AwsS3Service {
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final FileSecurityValidator fileSecurityValidator;

    @Value("${cloud.aws.s3.buckets.upload.name}")
    private String bucket;

    @Value("${cloud.aws.s3.buckets.static.name}")
    private String staticBucket;

    @Value("${cloud.aws.region.static:ap-northeast-2}")
    private String region;

    // 프리사인드 URL 만료 시간
    private static final Duration PRESIGNED_URL_EXPIRATION = Duration.ofHours(1); // 개인 이미지용 (1시간)

    // 정적 자산 경로 상수
    private static final String CHALLENGE_IMAGE_PREFIX = "challenges/";
    private static final String PROFILE_DEFAULT_IMAGE_PREFIX = "profile-defaults/";
    private static final String DIARY_IMAGE_PREFIX = "diary/";

    public String upload(MultipartFile image) {
        // 입력받은 이미지 파일이 빈 파일인지 검증
        if (image.isEmpty() || Objects.isNull(image.getOriginalFilename())) {
            log.error("이미지가 비어있거나 파일 이름이 없습니다.");
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // 🔒 보안 검증 추가
        fileSecurityValidator.validateFile(image);

        // uploadImage를 호출하여 S3에 저장된 이미지의 public url을 반환한다.
        return this.uploadImage(image);
    }

    // 빌드 테스트를 위한 주석
    private String uploadImage(MultipartFile image) {
        // validateImageFileExtention()은 이제 FileSecurityValidator에서 처리하므로 제거
        // this.validateImageFileExtension(image.getOriginalFilename());
        try {
            // uploadImageToS3()를 호출하여 이미지를 S3에 업로드하고,
            // S3에 저장된 이미지의 public url을 받아서 서비스 로직에 반환한다.
            return this.uploadImageToS3(image);
        } catch (IOException e) {
            log.error("이미지 업로드 중 IO 예외가 발생했습니다: " + e.getMessage());
            throw new CustomException(ErrorCode.S3_UPLOAD_IO_ERROR);
        }
    }

    /**
     * @deprecated 기본 확장자 검증은 FileSecurityValidator로 대체됨
     *             하위 호환성을 위해 유지하지만 사용하지 않음
     */
    @Deprecated
    @SuppressWarnings("unused")
    private void validateImageFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            log.error("확장자를 찾을 수 없습니다. 파일명: " + filename);
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }

        String extension = filename.substring(lastDotIndex + 1).toLowerCase();
        List<String> allowedExtensionList = Arrays.asList("jpg", "jpeg", "png", "gif");

        if (!allowedExtensionList.contains(extension)) {
            log.error(allowedExtensionList.toString() + "의 확장자만 사용 가능합니다. 확장자: " + extension);
            throw new CustomException(ErrorCode.S3_UNSUPPORTED_FILE_TYPE);
        }
    }

    // 이미지를 S3에 업로드하고, S3 키를 반환한다. (URL 대신 키만 저장)
    public String uploadImageToS3(MultipartFile image) throws IOException {
        String originalFilename = image.getOriginalFilename(); // 원본 파일 명
        if (originalFilename == null || originalFilename.isEmpty()) {
            log.error("파일명이 없습니다.");
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }

        // 확장자 추출
        int lastDotIndex = originalFilename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            log.error("확장자를 찾을 수 없습니다. 파일명: {}", originalFilename);
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }
        String extension = originalFilename.substring(lastDotIndex + 1).toLowerCase();

        // 한글 파일명 문제 방지: UUID + 확장자만 사용 (원본 파일명 제거)
        String s3FileName = UUID.randomUUID().toString() + "." + extension;

        log.info("S3 업로드 시작 - 파일명: {}, 확장자: {}, S3 파일명: {}, 버킷: {}",
                originalFilename, extension, s3FileName, bucket);

        // MultipartFile의 InputStream을 사용
        try (InputStream inputStream = image.getInputStream()) {
            // PutObjectRequest 생성 (ACL 없이 업로드 - 버킷 정책으로 접근 제어)
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket) // bucket 변수를 사용
                    .key(s3FileName)
                    .contentType("image/" + extension) // 콘텐츠 타입 설정
                    .build();

            log.info("PutObjectRequest 생성 완료 - 버킷: {}, 키: {}", bucket, s3FileName);

            // S3에 객체 업로드 (ACL 없이)
            s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, image.getSize()));
            log.info("S3 객체 업로드 성공 - 키: {}", s3FileName);

            // S3 키만 반환 (URL 대신)
            return s3FileName;

        } catch (Exception e) {
            log.error("S3 업로드 실패 - 파일명: {}, 오류: {}", s3FileName, e.getMessage(), e);
            throw new CustomException(ErrorCode.S3_UPLOAD_ERROR);
        }
    }

    // 프로필 이미지 최대 크기 (3MB)
    private static final long PROFILE_IMAGE_MAX_SIZE = 3 * 1024 * 1024; // 3MB

    /**
     * 프로필 이미지를 S3에 업로드한다 (고정 파일명 사용).
     * 기존 프로필 이미지는 자동으로 삭제된다.
     * 
     * @param image   업로드할 이미지 파일
     * @param userIdx 사용자 ID
     * @return S3 키 (예: "profile/profile_1.jpg")
     * @throws IOException 파일 읽기 오류 시
     */
    public String uploadProfileImage(MultipartFile image, Integer userIdx) throws IOException {
        if (image.isEmpty() || Objects.isNull(image.getOriginalFilename())) {
            log.error("프로필 이미지가 비어있거나 파일 이름이 없습니다.");
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // 🔒 종합 보안 검증 (매직 넘버, 파일 크기, 이중 확장자 등)
        fileSecurityValidator.validateFile(image);

        // 파일 크기 검증 (프로필 이미지는 3MB로 제한 - 추가 검증)
        if (image.getSize() > PROFILE_IMAGE_MAX_SIZE) {
            log.error("프로필 이미지 크기 초과 - 크기: {} bytes, 최대 크기: {} bytes",
                    image.getSize(), PROFILE_IMAGE_MAX_SIZE);
            throw new CustomException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        // 확장자 추출
        String extension = extractExtension(image.getOriginalFilename());

        // 고정 파일명: profile/profile_{userIdx}.{extension}
        String s3Key = String.format("profile/profile_%d.%s", userIdx, extension);

        // 기존 프로필 이미지 삭제 (다른 확장자일 수 있으므로)
        deleteProfileImageIfExists(userIdx);

        log.info("프로필 이미지 업로드 시작 - userIdx: {}, S3 키: {}, 버킷: {}",
                userIdx, s3Key, bucket);

        // 이미지 업로드
        try (InputStream inputStream = image.getInputStream()) {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .contentType("image/" + extension)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, image.getSize()));
            log.info("프로필 이미지 업로드 성공 - 키: {}", s3Key);

            return s3Key;
        } catch (Exception e) {
            log.error("프로필 이미지 업로드 실패 - 키: {}, 오류: {}", s3Key, e.getMessage(), e);
            throw new CustomException(ErrorCode.S3_UPLOAD_ERROR);
        }
    }

    /**
     * 기존 프로필 이미지를 삭제한다 (여러 확장자 지원).
     * 
     * @param userIdx 사용자 ID
     */
    private void deleteProfileImageIfExists(Integer userIdx) {
        String[] extensions = { "jpg", "jpeg", "png", "gif" };
        for (String ext : extensions) {
            try {
                String key = String.format("profile/profile_%d.%s", userIdx, ext);
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(bucket)
                        .key(key)
                        .build());
                log.debug("기존 프로필 이미지 삭제 시도 - 키: {}", key);
            } catch (Exception e) {
                // 파일이 없으면 무시 (정상적인 경우)
                log.debug("기존 프로필 이미지 없음 또는 삭제 불필요 - userIdx: {}, 확장자: {}", userIdx, ext);
            }
        }
    }

    /**
     * 다이어리 이미지를 S3에 업로드한다.
     * 경로 구조: diary/{userId}/{yyyy}/{MM}/{uuid}.{extension}
     * 
     * @param image   업로드할 이미지 파일
     * @param userIdx 사용자 ID
     * @return S3 키 (예: "diary/1/2024/12/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg")
     * @throws IOException 파일 읽기 오류 시
     */
    public String uploadDiaryImage(MultipartFile image, Integer userIdx) throws IOException {
        if (image.isEmpty() || Objects.isNull(image.getOriginalFilename())) {
            log.error("다이어리 이미지가 비어있거나 파일 이름이 없습니다.");
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // 🔒 종합 보안 검증 (매직 넘버, 파일 크기, 이중 확장자 등)
        fileSecurityValidator.validateFile(image);

        // 확장자 추출
        String extension = extractExtension(image.getOriginalFilename());

        // 현재 날짜로 년/월 추출
        java.time.LocalDate now = java.time.LocalDate.now();
        int year = now.getYear();
        int month = now.getMonthValue();

        // UUID 생성
        String uuid = UUID.randomUUID().toString();

        // S3 키 생성: diary/{userId}/{yyyy}/{MM}/{uuid}.{extension}
        String s3Key = String.format("%s%d/%d/%02d/%s.%s",
                DIARY_IMAGE_PREFIX, userIdx, year, month, uuid, extension);

        log.info("다이어리 이미지 업로드 시작 - userIdx: {}, S3 키: {}, 버킷: {}",
                userIdx, s3Key, bucket);

        // 이미지 업로드
        try (InputStream inputStream = image.getInputStream()) {
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(s3Key)
                    .contentType("image/" + extension)
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, image.getSize()));
            log.info("다이어리 이미지 업로드 성공 - 키: {}", s3Key);

            return s3Key;
        } catch (Exception e) {
            log.error("다이어리 이미지 업로드 실패 - 키: {}, 오류: {}", s3Key, e.getMessage(), e);
            throw new CustomException(ErrorCode.S3_UPLOAD_ERROR);
        }
    }

    /**
     * 파일명에서 확장자를 추출한다.
     * 
     * @param filename 파일명
     * @return 확장자 (소문자)
     */
    private String extractExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }
        int lastDotIndex = filename.lastIndexOf(".");
        if (lastDotIndex == -1) {
            throw new CustomException(ErrorCode.S3_FILE_EXTENSION_NOT_FOUND);
        }
        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * S3 키로부터 프리사인드 URL을 생성한다.
     * 
     * @param s3Key S3 객체 키 (파일명)
     * @return 프리사인드 URL (1시간 유효)
     */
    public String generatePresignedUrl(String s3Key) {
        return generatePresignedUrl(s3Key, PRESIGNED_URL_EXPIRATION);
    }

    /**
     * S3 키로부터 프리사인드 URL을 생성한다 (만료 시간 지정 가능).
     * 
     * @param s3Key      S3 객체 키 (파일명)
     * @param expiration 만료 시간
     * @return 프리사인드 URL
     */
    public String generatePresignedUrl(String s3Key, Duration expiration) {
        if (s3Key == null || s3Key.isEmpty()) {
            return null;
        }

        try {
            // URL에서 키 추출 (기존 URL 형식 지원)
            String key = extractKeyFromUrlOrKey(s3Key);

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            String presignedUrl = presignedRequest.url().toString();

            log.info("프리사인드 URL 생성 완료 - 키: {}, 만료 시간: {}일, URL: {}",
                    key, expiration.toDays(),
                    presignedUrl.substring(0, Math.min(100, presignedUrl.length())));
            return presignedUrl;

        } catch (Exception e) {
            String extractedKey = null;
            try {
                extractedKey = extractKeyFromUrlOrKey(s3Key);
            } catch (Exception ex) {
                log.warn("키 추출도 실패: {}", s3Key, ex);
            }
            log.error("프리사인드 URL 생성 실패 - 원본: {}, 추출된 키: {}, 오류: {}", s3Key, extractedKey, e.getMessage(), e);
            // 실패 시 null 반환 (클라이언트에서 처리)
            return null;
        }
    }

    /**
     * 여러 S3 키로부터 프리사인드 URL 목록을 생성한다.
     * 
     * @param s3Keys S3 객체 키 목록
     * @return 프리사인드 URL 목록
     */
    public List<String> generatePresignedUrls(List<String> s3Keys) {
        if (s3Keys == null || s3Keys.isEmpty()) {
            return List.of();
        }

        return s3Keys.stream()
                .map(this::generatePresignedUrl)
                .filter(Objects::nonNull)
                .toList();
    }

    /**
     * URL 또는 키에서 실제 S3 키를 추출한다.
     * 기존 URL 형식과 새로운 키 형식 모두 지원한다.
     * 프리사인드 URL에서도 키를 추출할 수 있다.
     */
    public String extractKeyFromUrlOrKey(String urlOrKey) {
        if (urlOrKey == null || urlOrKey.isEmpty()) {
            return urlOrKey;
        }

        // URL 형식인지 확인 (http:// 또는 https:// 포함)
        if (urlOrKey.contains("://")) {
            // URL 형식인 경우 키 추출
            try {
                String key = getKeyFromImageAddress(urlOrKey);
                // 버킷 이름 제거
                key = removeBucketNameFromKey(key);
                log.debug("URL에서 키 추출 성공 - URL: {}, 키: {}", urlOrKey, key);
                return key;
            } catch (Exception e) {
                log.warn("URL에서 키 추출 실패, 원본 값 사용: {}", urlOrKey, e);
                return urlOrKey;
            }
        }

        // 키 형식인 경우 (URL이 아닌 경우)
        // 버킷 이름이 포함되어 있을 수 있으므로 제거
        String cleanedKey = removeBucketNameFromKey(urlOrKey);
        log.debug("키 형식으로 인식 - 원본: {}, 정리된 키: {}", urlOrKey, cleanedKey);
        return cleanedKey;
    }

    /**
     * 키에서 버킷 이름을 제거한다.
     * 과거 데이터에서 버킷 이름이 포함된 키 형식을 지원한다.
     * 예: "www.mooddisk.com/5a2be486-dIMG_9817.jpg" -> "5a2be486-dIMG_9817.jpg"
     */
    private String removeBucketNameFromKey(String key) {
        if (key == null || key.isEmpty()) {
            return key;
        }

        log.info("버킷 이름 제거 시도 - 원본 키: {}, 버킷 이름: {}", key, bucket);

        // 버킷 이름이 키 앞에 포함된 경우 제거
        // 형식: "버킷이름/실제키" 또는 "버킷이름/경로/실제키"
        if (key.startsWith(bucket + "/")) {
            String cleanedKey = key.substring(bucket.length() + 1);
            log.info("버킷 이름 제거 성공 - 원본: {}, 정리된 키: {}", key, cleanedKey);
            return cleanedKey;
        }

        // 버킷 이름이 포함되지 않은 경우 그대로 반환
        log.info("버킷 이름이 포함되지 않음 - 키: {}", key);
        return key;
    }

    // 업로드 된 이미지를 삭제한다.
    public void deleteImageFromS3(String imageAddressOrKey) {
        String key = extractKeyFromUrlOrKey(imageAddressOrKey);

        try {
            // S3에서 객체 삭제
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());

            log.info("S3에서 이미지 삭제 성공: {}", key);
        } catch (S3Exception e) {
            log.error("S3 이미지 삭제 실패: {}, 오류 메시지: {}", key, e.getMessage());
            throw new CustomException(ErrorCode.S3_DELETE_ERROR);
        } catch (Exception e) {
            log.error("알 수 없는 오류 발생: {}, 오류 메시지: {}", key, e.getMessage());
            throw new CustomException(ErrorCode.S3_DELETE_UNEXPECTED_ERROR);
        }
    }

    // ACL 관련 메서드 제거 (버킷 정책으로 접근 제어)

    // S3 버킷 권한 테스트
    public String testS3Permissions() {
        try {
            // 버킷 존재 여부 확인
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            log.info("S3 버킷 접근 가능: {}", bucket);

            // 간단한 테스트 객체 업로드 시도
            String testKey = "test-permissions-" + System.currentTimeMillis() + ".txt";
            String testContent = "test";

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(testKey)
                    .contentType("text/plain")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromString(testContent));
            log.info("S3 업로드 테스트 성공: {}", testKey);

            // ACL 테스트 제거 (버킷 정책 사용)

            // 테스트 객체 삭제
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(testKey)
                    .build());
            log.info("S3 테스트 객체 삭제 완료: {}", testKey);

            return "S3 권한 테스트 성공 - 업로드: OK, ACL: 버킷 정책 사용";

        } catch (Exception e) {
            log.error("S3 권한 테스트 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.S3_UPLOAD_ERROR);
        }
    }

    private String getKeyFromImageAddress(String imageAddress) {
        try {
            URL url = new URL(imageAddress);
            String path = url.getPath();
            String host = url.getHost();

            log.info("프리사인드 URL 파싱 - host: {}, path: {}, full URL: {}", host, path, imageAddress);

            // 경로가 비어있거나 '/'만 있는 경우
            if (path == null || path.isEmpty() || path.equals("/")) {
                log.warn("URL에 경로가 없음: {}", imageAddress);
                throw new CustomException(ErrorCode.S3_INVALID_VALUE_URL);
            }

            // URL 디코딩
            String decodingKey = URLDecoder.decode(path, "UTF-8");

            // 맨 앞의 '/' 제거
            if (decodingKey.startsWith("/")) {
                decodingKey = decodingKey.substring(1);
            }

            // 쿼리 파라미터가 있는 경우 제거 (프리사인드 URL의 경우)
            if (decodingKey.contains("?")) {
                decodingKey = decodingKey.substring(0, decodingKey.indexOf("?"));
            }

            log.info("URL에서 키 추출 - 원본 URL: {}, 추출된 키: {}", imageAddress, decodingKey);
            return decodingKey;

        } catch (MalformedURLException e) {
            log.error("잘못된 URL 형식: {}", imageAddress, e);
            throw new CustomException(ErrorCode.S3_INVALID_VALUE_URL);
        } catch (UnsupportedEncodingException e) {
            log.error("URL 디코딩 실패: {}", imageAddress, e);
            throw new CustomException(ErrorCode.S3_URL_DECODING_ERROR);
        } catch (Exception e) {
            log.error("URL에서 키 추출 중 예외 발생: {}", imageAddress, e);
            throw new CustomException(ErrorCode.S3_INVALID_VALUE_URL);
        }
    }

    // ==================== Static Bucket Methods ====================

    /**
     * 챌린지 프로필 이미지를 static 버킷에 업로드한다.
     * 공개 접근 가능한 정적 자산으로 저장된다.
     * 
     * @param image        업로드할 이미지 파일
     * @param challengeIdx 챌린지 ID (선택사항, 파일명에 포함)
     * @return S3 키 (경로 포함)
     */
    public String uploadChallengeProfileImage(MultipartFile image, Integer challengeIdx) {
        if (image.isEmpty() || Objects.isNull(image.getOriginalFilename())) {
            log.error("챌린지 이미지가 비어있거나 파일 이름이 없습니다.");
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // 🔒 종합 보안 검증
        fileSecurityValidator.validateFile(image);

        try {
            String originalFilename = image.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();

            // 파일명 생성: challenges/{challengeIdx}-{UUID}.{extension} 또는
            // challenges/{UUID}.{extension}
            String fileName = challengeIdx != null
                    ? String.format("%s%d-%s.%s", CHALLENGE_IMAGE_PREFIX, challengeIdx, UUID.randomUUID().toString(),
                            extension)
                    : String.format("%s%s.%s", CHALLENGE_IMAGE_PREFIX, UUID.randomUUID().toString(), extension);

            log.info("챌린지 이미지 업로드 시작 - 파일명: {}, S3 키: {}, 버킷: {}",
                    originalFilename, fileName, staticBucket);

            try (InputStream inputStream = image.getInputStream()) {
                PutObjectRequest putRequest = PutObjectRequest.builder()
                        .bucket(staticBucket)
                        .key(fileName)
                        .contentType("image/" + extension)
                        .build();

                s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, image.getSize()));
                log.info("챌린지 이미지 업로드 성공 - 키: {}", fileName);

                return fileName;
            }
        } catch (IOException e) {
            log.error("챌린지 이미지 업로드 중 IO 예외 발생: {}", e.getMessage());
            throw new CustomException(ErrorCode.S3_UPLOAD_IO_ERROR);
        } catch (Exception e) {
            log.error("챌린지 이미지 업로드 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.S3_UPLOAD_ERROR);
        }
    }

    /**
     * 프로필 기본 이미지를 static 버킷에 업로드한다.
     * 
     * @param image     업로드할 이미지 파일
     * @param imageName 이미지 이름 (예: "default-male.png", "default-female.png")
     * @return S3 키 (경로 포함)
     */
    public String uploadProfileDefaultImage(MultipartFile image, String imageName) {
        if (image.isEmpty() || Objects.isNull(image.getOriginalFilename())) {
            log.error("프로필 기본 이미지가 비어있거나 파일 이름이 없습니다.");
            throw new CustomException(ErrorCode.S3_IMAGE_NOT_FOUND);
        }

        // 🔒 종합 보안 검증
        fileSecurityValidator.validateFile(image);

        try {
            String originalFilename = image.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();

            // 파일명 생성: profile-defaults/{imageName} 또는 profile-defaults/{UUID}.{extension}
            String fileName = imageName != null && !imageName.isEmpty()
                    ? String.format("%s%s", PROFILE_DEFAULT_IMAGE_PREFIX, imageName)
                    : String.format("%s%s.%s", PROFILE_DEFAULT_IMAGE_PREFIX, UUID.randomUUID().toString(), extension);

            // 확장자가 없으면 원본 파일의 확장자 추가
            if (!fileName.contains(".")) {
                fileName = fileName + "." + extension;
            }

            log.info("프로필 기본 이미지 업로드 시작 - 파일명: {}, S3 키: {}, 버킷: {}",
                    originalFilename, fileName, staticBucket);

            try (InputStream inputStream = image.getInputStream()) {
                PutObjectRequest putRequest = PutObjectRequest.builder()
                        .bucket(staticBucket)
                        .key(fileName)
                        .contentType("image/" + extension)
                        .build();

                s3Client.putObject(putRequest, RequestBody.fromInputStream(inputStream, image.getSize()));
                log.info("프로필 기본 이미지 업로드 성공 - 키: {}", fileName);

                return fileName;
            }
        } catch (IOException e) {
            log.error("프로필 기본 이미지 업로드 중 IO 예외 발생: {}", e.getMessage());
            throw new CustomException(ErrorCode.S3_UPLOAD_IO_ERROR);
        } catch (Exception e) {
            log.error("프로필 기본 이미지 업로드 실패: {}", e.getMessage(), e);
            throw new CustomException(ErrorCode.S3_UPLOAD_ERROR);
        }
    }

    /**
     * Static 버킷의 이미지에 대한 공개 URL을 생성한다.
     * CloudFront를 사용하는 경우 CloudFront URL을 반환하고,
     * 그렇지 않으면 S3 공개 URL을 반환한다.
     * 
     * @param s3Key S3 객체 키 (경로 포함 가능)
     * @return 공개 접근 가능한 URL
     */
    public String generateStaticImageUrl(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            return null;
        }

        // 키에서 경로 정리
        String key = s3Key.startsWith("/") ? s3Key.substring(1) : s3Key;

        // CloudFront URL이 설정되어 있으면 사용 (환경변수로 설정 가능)
        String cloudFrontUrl = System.getenv("CLOUDFRONT_STATIC_URL");
        if (cloudFrontUrl != null && !cloudFrontUrl.isEmpty()) {
            String url = cloudFrontUrl.endsWith("/")
                    ? cloudFrontUrl + key
                    : cloudFrontUrl + "/" + key;
            log.debug("CloudFront URL 생성 - 키: {}, URL: {}", key, url);
            return url;
        }

        // CloudFront가 없으면 S3 공개 URL 생성
        String url = String.format("https://%s.s3.%s.amazonaws.com/%s", staticBucket, region, key);
        log.debug("S3 공개 URL 생성 - 키: {}, URL: {}", key, url);
        return url;
    }

    /**
     * Static 버킷에서 이미지를 삭제한다.
     * 
     * @param s3Key S3 객체 키 (경로 포함 가능)
     */
    public void deleteStaticImage(String s3Key) {
        if (s3Key == null || s3Key.isEmpty()) {
            log.warn("삭제할 이미지 키가 없습니다.");
            return;
        }

        String key = s3Key.startsWith("/") ? s3Key.substring(1) : s3Key;

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(staticBucket)
                    .key(key)
                    .build());
            log.info("Static 버킷에서 이미지 삭제 성공: {}", key);
        } catch (S3Exception e) {
            log.error("Static 버킷 이미지 삭제 실패: {}, 오류 메시지: {}", key, e.getMessage());
            throw new CustomException(ErrorCode.S3_DELETE_ERROR);
        } catch (Exception e) {
            log.error("Static 버킷 이미지 삭제 중 알 수 없는 오류: {}, 오류 메시지: {}", key, e.getMessage());
            throw new CustomException(ErrorCode.S3_DELETE_UNEXPECTED_ERROR);
        }
    }

    /**
     * Static 버킷의 챌린지 이미지 목록을 가져온다.
     * 
     * @param challengeIdx 챌린지 ID (선택사항)
     * @return 이미지 키 목록
     */
    public List<String> listChallengeImages(Integer challengeIdx) {
        try {
            String prefix = challengeIdx != null
                    ? CHALLENGE_IMAGE_PREFIX + challengeIdx + "-"
                    : CHALLENGE_IMAGE_PREFIX;

            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(staticBucket)
                    .prefix(prefix)
                    .build();

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);

            return listResponse.contents().stream()
                    .map(S3Object::key)
                    .toList();
        } catch (Exception e) {
            log.error("챌린지 이미지 목록 조회 실패: {}", e.getMessage(), e);
            return List.of();
        }
    }

    /**
     * Static 버킷의 프로필 기본 이미지 목록을 가져온다.
     * 
     * @return 이미지 키 목록
     */
    public List<String> listProfileDefaultImages() {
        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(staticBucket)
                    .prefix(PROFILE_DEFAULT_IMAGE_PREFIX)
                    .build();

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);

            return listResponse.contents().stream()
                    .map(S3Object::key)
                    .toList();
        } catch (Exception e) {
            log.error("프로필 기본 이미지 목록 조회 실패: {}", e.getMessage(), e);
            return List.of();
        }
    }
}
