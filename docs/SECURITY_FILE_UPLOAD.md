# 파일 업로드 보안 가이드

## 📋 개요

본 문서는 MoodDisk 프로젝트에 구현된 파일 업로드 보안 기능에 대해 설명합니다.

## 🔐 구현된 보안 기능

### 1. 매직 넘버 검증 (File Signature Validation)

파일의 실제 내용(바이트 시그니처)을 검사하여 확장자 위조를 방지합니다.

**지원 형식:**

- **JPEG/JPG**: `FF D8 FF`
- **PNG**: `89 50 4E 47 0D 0A 1A 0A`
- **GIF**: `47 49 46 38`

**예시:**

```
✅ 정상: image.jpg 파일이 실제로 JPEG 시그니처(FF D8 FF)로 시작
🚫 차단: malicious.exe 파일명을 image.jpg로 변경한 경우
```

### 2. 파일 크기 제한

서비스 안정성을 위해 파일 크기를 제한합니다.

- **다이어리/챌린지 이미지**: 최대 5MB
- **프로필 이미지**: 최대 3MB

### 3. 이중 확장자 공격 방지

여러 개의 확장자를 가진 파일을 차단합니다.

**차단되는 예시:**

```
🚫 image.php.jpg
🚫 script.jsp.png
🚫 malware.exe.gif
```

**금지된 확장자 목록:**

- 실행 파일: `php`, `jsp`, `asp`, `aspx`, `exe`, `sh`, `bat`, `cmd`
- 스크립트: `js`, `html`, `htm`, `xml`, `svg`, `swf`, `xhtml`

### 4. Content-Type 검증

HTTP 헤더의 MIME 타입을 검증합니다.

**허용되는 MIME 타입:**

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`

### 5. 이미지 메타데이터 검증

`ImageIO`를 사용하여 실제로 유효한 이미지 파일인지 확인합니다.

**검증 항목:**

- 이미지 파싱 가능 여부
- 해상도 제한: 최대 4096×4096 픽셀
- 최소 크기: 10×10 픽셀

### 6. Path Traversal 공격 방지

파일명에 경로 조작 문자가 포함되어 있는지 검사합니다.

**차단되는 패턴:**

```
🚫 ../../../etc/passwd
🚫 ..\..\windows\system32
🚫 path/to/file
```

### 7. Null Byte 공격 방지

파일명에 null byte(`\0`)가 포함된 경우를 차단합니다.

## 📁 구현 파일

### 1. FileSecurityValidator.java

```
위치: src/main/java/com/astro/mood/utils/FileSecurityValidator.java
역할: 파일 보안 검증 로직을 담당하는 유틸리티 클래스
```

**주요 메서드:**

- `validateFile(MultipartFile file)`: 종합 보안 검증
- `validateMagicNumber(byte[] fileBytes, String extension)`: 매직 넘버 검증
- `validateImageMetadata(byte[] fileBytes, String filename)`: 이미지 메타데이터 검증
- `validateDoubleExtension(String filename)`: 이중 확장자 검증

### 2. AwsS3Service.java 수정

```
위치: src/main/java/com/astro/mood/service/s3Image/AwsS3Service.java
역할: S3 업로드 전 보안 검증 통합
```

**수정된 메서드:**

- `upload(MultipartFile image)`: 일반 이미지 업로드
- `uploadProfileImage(MultipartFile image, Integer userIdx)`: 프로필 이미지 업로드
- `uploadDiaryImage(MultipartFile image, Integer userIdx)`: 다이어리 이미지 업로드
- `uploadChallengeProfileImage(MultipartFile image, Integer challengeIdx)`: 챌린지 이미지 업로드
- `uploadProfileDefaultImage(MultipartFile image, String imageName)`: 기본 프로필 이미지 업로드

### 3. DiaryController.java 수정

```
위치: src/main/java/com/astro/mood/web/controller/diary/DiaryController.java
역할: 일기 작성/수정 시 이미지 개수 및 보안 검증
```

**추가된 검증:**

- 이미지 개수 제한 (최대 3개)
- 각 이미지에 대한 보안 검증
- 상세한 로깅

## 🔄 검증 흐름

```
클라이언트 업로드
    ↓
Controller (DiaryController/UserController)
    ├─ 이미지 개수 검증
    ├─ FileSecurityValidator.validateFile() 호출
    └─ AwsS3Service 호출
         ↓
AwsS3Service
    ├─ FileSecurityValidator.validateFile() 호출 (중복 방어)
    └─ S3 업로드
         ↓
S3 저장 완료
```

## 🚨 에러 처리

### 에러 코드

```java
S3_IMAGE_NOT_FOUND (40011): 유효하지 않은 이미지 파일
FILE_SIZE_EXCEEDED (40016): 파일 크기 초과
S3_FILE_EXTENSION_NOT_FOUND (40012): 파일 확장자 없음
S3_UPLOAD_ERROR (50010): S3 업로드 실패
```

### 로그 예시

**성공 케이스:**

```
INFO  - 파일 보안 검증 시작: filename=photo.jpg, size=1024000, contentType=image/jpeg
INFO  - 이미지 메타데이터 검증 완료: filename=photo.jpg, size=1920x1080
INFO  - ✅ 파일 보안 검증 통과: filename=photo.jpg
```

**실패 케이스:**

```
WARN  - 🚫 매직 넘버 불일치 - 파일 형식 위조 의심: extension=jpg, expected=FF D8 FF, actual=4D 5A 90 00
```

```
WARN  - 🚫 이중 확장자 공격 시도 감지: filename=malware.php.jpg, forbidden_ext=php
```

```
WARN  - 🚫 파일 크기 초과: size=6MB, max=5MB
```

## 📊 보안 검증 통계

각 검증 단계에서 차단되는 케이스:

1. **매직 넘버 불일치**: 확장자 위조 시도
2. **이중 확장자**: 스크립트 파일 업로드 시도
3. **파일 크기 초과**: DoS 공격 시도
4. **유효하지 않은 이미지**: 손상된 파일 또는 위조 파일
5. **Path Traversal**: 경로 조작 공격 시도

## 🔧 설정 및 커스터마이징

### 파일 크기 제한 변경

```java
// FileSecurityValidator.java
private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// AwsS3Service.java
private static final long PROFILE_IMAGE_MAX_SIZE = 3 * 1024 * 1024; // 3MB
```

### 허용 확장자 추가

```java
// FileSecurityValidator.java
private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
    "jpg", "jpeg", "png", "gif" // 여기에 추가
);

private static final Map<String, byte[]> FILE_SIGNATURES = Map.of(
    "jpg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF},
    // 새 형식의 매직 넘버 추가
);
```

### 이미지 해상도 제한 변경

```java
// FileSecurityValidator.java
private static final int MAX_IMAGE_WIDTH = 4096;
private static final int MAX_IMAGE_HEIGHT = 4096;
```

## ✅ 테스트

### 단위 테스트 작성 권장사항

```java
@Test
void testValidateFile_ValidImage() {
    // 정상적인 이미지 파일 검증
}

@Test
void testValidateFile_MagicNumberMismatch() {
    // 매직 넘버 불일치 파일 차단
}

@Test
void testValidateFile_DoubleExtension() {
    // 이중 확장자 파일 차단
}

@Test
void testValidateFile_FileSizeExceeded() {
    // 파일 크기 초과 차단
}
```

### 통합 테스트

1. **정상 이미지 업로드**: JPEG, PNG, GIF 파일 각각 업로드
2. **악성 파일 차단**: 확장자만 변경한 EXE, PHP 파일 업로드 시도
3. **대용량 파일 차단**: 5MB 이상 파일 업로드 시도
4. **이중 확장자 차단**: `image.php.jpg` 업로드 시도

## 📝 참고 자료

- [OWASP File Upload Security](https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload)
- [File Signature Database](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)

## 🔄 업데이트 이력

| 날짜       | 버전  | 내용                                               |
| ---------- | ----- | -------------------------------------------------- |
| 2024-12-03 | 1.0.0 | 초기 구현 (매직 넘버, 이중 확장자, 파일 크기 검증) |
