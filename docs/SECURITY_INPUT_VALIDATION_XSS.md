# 입력 검증 및 XSS 방어 가이드

## 📋 개요

본 문서는 MoodDisk 프로젝트에 구현된 입력 검증(Input Validation)과 XSS(Cross-Site Scripting) 방어 기능에 대해 설명합니다.

## 🛡️ 보안 위협 및 방어 메커니즘

### 1. XSS (Cross-Site Scripting)

**공격 방식:**

- 악의적인 스크립트를 웹 페이지에 삽입
- 사용자의 브라우저에서 실행되어 쿠키, 세션 탈취
- 사용자 계정으로 악의적인 행동 수행

**예시:**

```html
<!-- 공격 시도 -->
<script>
  alert("XSS");
</script>
<img src="x" onerror="alert('XSS')" />
<a href="javascript:alert('XSS')">Click</a>
```

**방어 메커니즘:**

- Request Parameter/Header 필터링
- HTML 특수문자 이스케이프
- 위험한 태그 및 이벤트 핸들러 제거
- Content-Type 검증

### 2. SQL Injection

**공격 방식:**

- SQL 쿼리를 조작하여 데이터베이스 접근
- 데이터 유출, 수정, 삭제

**예시:**

```sql
-- 공격 시도
email=' OR '1'='1
password='; DROP TABLE users; --
```

**방어 메커니즘:**

- JPA/Hibernate의 Prepared Statement (기본 방어)
- 입력값 패턴 검증
- SQL 키워드 필터링

### 3. Path Traversal

**공격 방식:**

- 파일 경로를 조작하여 시스템 파일 접근
- 민감한 정보 유출

**예시:**

```
../../../etc/passwd
..\..\windows\system32
```

**방어 메커니즘:**

- 경로 문자열 검증
- .. 패턴 차단
- URL 인코딩 우회 방지

## 📁 구현 파일

### 1. XssProtectionUtil.java ✨

```
위치: src/main/java/com/astro/mood/utils/XssProtectionUtil.java
역할: XSS, SQL Injection, Path Traversal 패턴 검증 및 제거
```

**주요 메서드:**

```java
// XSS 패턴 검사
boolean containsXss(String value)

// XSS 패턴 제거 (Sanitization)
String sanitize(String value)

// HTML 이스케이프
String escapeHtml(String value)

// SQL Injection 패턴 검사
boolean containsSqlInjection(String value)

// Path Traversal 패턴 검사
boolean containsPathTraversal(String value)

// 종합 보안 검증
boolean isSafe(String value)
```

### 2. InputValidationUtil.java

```
위치: src/main/java/com/astro/mood/utils/InputValidationUtil.java
역할: 이메일, 전화번호, 닉네임 등 입력값 형식 검증
```

**주요 메서드:**

```java
// 이메일 형식 검증
boolean isValidEmail(String email)

// 전화번호 형식 검증
boolean isValidPhone(String phone)

// 닉네임 형식 검증 (2-10자, 한글/영문/숫자)
boolean isValidNickname(String nickname)

// URL 형식 검증
boolean isValidUrl(String url)

// 비밀번호 강도 검증 (8-20자, 영문+숫자)
boolean isValidPassword(String password)

// 길이 범위 검증
boolean isValidLength(String value, int min, int max)
```

### 3. XssFilter.java

```
위치: src/main/java/com/astro/mood/security/filter/XssFilter.java
역할: HTTP 요청의 Parameter와 Header를 검증하여 XSS 차단
```

**동작 방식:**

1. Request Parameter 검증
2. Request Header 검증 (User-Agent, Referer 등)
3. XSS 패턴 발견 시 400 응답

### 4. @SafeText 커스텀 어노테이션 ✨

```
위치: src/main/java/com/astro/mood/validation/SafeText.java
역할: DTO 필드에 선언적으로 입력 검증 적용
```

**사용 예시:**

```java
public class DiaryCreateRequest {

    @SafeText(maxLength = 5000, message = "일기 내용이 안전하지 않습니다")
    private String content;

    @SafeText(maxLength = 100, checkSqlInjection = false)
    private String title;

    @NotNull
    @SafeText(maxLength = 10)
    private String nickname;
}
```

**어노테이션 옵션:**

| 옵션                 | 타입    | 기본값                           | 설명                   |
| -------------------- | ------- | -------------------------------- | ---------------------- |
| `message`            | String  | "입력값에 허용되지 않은 패턴..." | 에러 메시지            |
| `maxLength`          | int     | 0                                | 최대 길이 (0=제한없음) |
| `checkXss`           | boolean | true                             | XSS 검증 활성화        |
| `checkSqlInjection`  | boolean | true                             | SQL Injection 검증     |
| `checkPathTraversal` | boolean | true                             | Path Traversal 검증    |

## 🔄 방어 계층

```
클라이언트 요청
    ↓
SecurityThreatFilter (악의적 경로 차단)
    ↓
XssFilter (Request Parameter/Header 검증) ← 새로 추가!
    ↓
RateLimitFilter (속도 제한)
    ↓
JWTFilter (인증)
    ↓
Controller
    ├─ @SafeText Validation (DTO 필드 검증) ← 새로 추가!
    └─ @Valid, @Validated
         ↓
Service Layer
    ├─ XssProtectionUtil (추가 검증)
    └─ InputValidationUtil (형식 검증)
         ↓
Repository (JPA Prepared Statement)
    ↓
Database
```

## 🚨 탐지 및 차단 예시

### XSS 공격 차단

**요청:**

```http
POST /api/diary HTTP/1.1
Content-Type: application/json

{
  "content": "<script>alert('XSS')</script>안녕하세요"
}
```

**응답:**

```http
HTTP/1.1 400 Bad Request

{
  "error": "XSS_PATTERN_DETECTED",
  "message": "요청에 허용되지 않은 스크립트 패턴이 포함되어 있습니다.",
  "status": 400
}
```

**로그:**

```
WARN  - 🚫 XSS 패턴 감지 - Parameter: name=content, value=<script>alert('XSS')...
```

### SQL Injection 차단

**요청:**

```http
GET /api/user?email=test@test.com' OR '1'='1 HTTP/1.1
```

**응답:**

```http
HTTP/1.1 400 Bad Request

{
  "error": "INVALID_INPUT_VALUE",
  "message": "입력값에 허용되지 않은 패턴이 포함되어 있습니다.",
  "status": 400
}
```

### Validation 어노테이션 검증 실패

**요청:**

```java
// DTO
public class UserUpdateRequest {
    @SafeText(maxLength = 10)
    private String nickname; // "ThisIsVeryLongNickname" (20자)
}
```

**응답:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "최대 10자까지 입력 가능합니다",
  "field": "nickname"
}
```

## 🔧 사용 가이드

### 1. DTO 필드 검증

```java
import com.astro.mood.validation.SafeText;
import jakarta.validation.constraints.NotNull;

public class DiaryCreateRequest {

    @NotNull(message = "일기 내용은 필수입니다")
    @SafeText(maxLength = 5000)
    private String content;

    @SafeText(maxLength = 100, checkSqlInjection = false)
    private String hashtags;
}
```

### 2. Service Layer에서 직접 검증

```java
@Service
@RequiredArgsConstructor
public class DiaryService {

    private final XssProtectionUtil xssProtectionUtil;
    private final InputValidationUtil inputValidationUtil;

    public void createDiary(DiaryCreateRequest request) {
        // XSS 검증
        if (!xssProtectionUtil.isSafe(request.getContent())) {
            throw new CustomException(ErrorCode.XSS_PATTERN_DETECTED);
        }

        // 이메일 형식 검증
        if (!inputValidationUtil.isValidEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.INVALID_VALUE_EMAIL);
        }

        // ... 비즈니스 로직
    }
}
```

### 3. HTML 출력 시 이스케이프

```java
// 사용자 입력을 화면에 표시할 때
String userInput = "<script>alert('XSS')</script>";
String safeOutput = xssProtectionUtil.escapeHtml(userInput);
// 결과: "&lt;script&gt;alert('XSS')&lt;/script&gt;"
```

## 📊 검증 패턴

### XSS 패턴

| 패턴          | 설명                | 예시                        |
| ------------- | ------------------- | --------------------------- |
| `<script>`    | Script 태그         | `<script>alert(1)</script>` |
| `javascript:` | JavaScript 프로토콜 | `<a href="javascript:...">` |
| `on*=`        | 이벤트 핸들러       | `<img onerror="...">`       |
| `<iframe>`    | iframe 태그         | `<iframe src="...">`        |
| `eval(`       | eval 함수           | `eval('malicious')`         |
| `<svg>`       | SVG with script     | `<svg onload="...">`        |

### SQL Injection 패턴

| 패턴               | 설명       | 예시                  |
| ------------------ | ---------- | --------------------- |
| `SELECT`, `INSERT` | SQL 키워드 | `SELECT * FROM users` |
| `--`               | SQL 주석   | `'; DROP TABLE--`     |
| `;`                | 쿼리 종료  | `'; DELETE FROM`      |
| `OR '1'='1'`       | 조건 우회  | `' OR '1'='1`         |

### Path Traversal 패턴

| 패턴     | 설명          | 예시                  |
| -------- | ------------- | --------------------- |
| `../`    | 상위 디렉토리 | `../../../etc/passwd` |
| `..\`    | Windows 경로  | `..\..\windows`       |
| `%2e%2e` | URL 인코딩    | `%2e%2e%2f`           |

## ⚙️ 설정

### XssFilter 제외 경로 추가

```java
// XssFilter.java
@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();

    // 새로운 경로 추가
    if (path.startsWith("/public/editor")) {
        return true; // 에디터 경로는 검증 제외
    }

    return false;
}
```

### 커스텀 XSS 패턴 추가

```java
// XssProtectionUtil.java
private static final Pattern[] XSS_PATTERNS = {
    // 기존 패턴들...

    // 새로운 패턴 추가
    Pattern.compile("alert\\s*\\(", Pattern.CASE_INSENSITIVE),
    Pattern.compile("prompt\\s*\\(", Pattern.CASE_INSENSITIVE),
};
```

## 🧪 테스트

### 단위 테스트 예시

```java
@SpringBootTest
class XssProtectionUtilTest {

    @Autowired
    private XssProtectionUtil xssProtectionUtil;

    @Test
    void testXssDetection() {
        // Given
        String malicious = "<script>alert('XSS')</script>";

        // When
        boolean result = xssProtectionUtil.containsXss(malicious);

        // Then
        assertTrue(result);
    }

    @Test
    void testSanitization() {
        // Given
        String input = "<script>alert('XSS')</script>안전한 텍스트";

        // When
        String cleaned = xssProtectionUtil.sanitize(input);

        // Then
        assertEquals("안전한 텍스트", cleaned);
    }
}
```

### 통합 테스트

```bash
# XSS 공격 시도
curl -X POST http://localhost:8080/api/diary \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(\"XSS\")</script>테스트"}' \
  -i

# 예상 응답: 400 Bad Request
```

## 📈 모니터링

### 주요 로그 메시지

```
🚫 XSS 패턴 감지: pattern=<script[^>]*>, value=<script>alert...
🚫 SQL Injection 의심 패턴 감지: value=' OR '1'='1
🚫 Path Traversal 패턴 감지: value=../../etc/passwd
🚫 문자열 길이 초과: length=5001, max=5000
```

### Grafana 대시보드

```
┌─────────────────────────────────────┐
│ XSS 공격 시도 (시간별)               │
│ ▁▂▃▅▇█▇▅▃▂▁                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 차단된 공격 유형                     │
│ XSS: 45%                            │
│ SQL Injection: 30%                  │
│ Path Traversal: 25%                 │
└─────────────────────────────────────┘
```

## 🎯 베스트 프랙티스

### 1. 다층 방어 (Defense in Depth)

```
1. Client-side: JavaScript 입력 검증
2. Filter Layer: XssFilter
3. Controller: @SafeText Validation
4. Service: XssProtectionUtil
5. Database: Prepared Statement
```

### 2. 화이트리스트 방식

```java
// ❌ 나쁜 예: 블랙리스트 (무한한 패턴)
if (!input.contains("<script>") && !input.contains("javascript:")) {
    // 처리
}

// ✅ 좋은 예: 화이트리스트 (허용된 것만)
if (SAFE_TEXT_PATTERN.matcher(input).matches()) {
    // 처리
}
```

### 3. 출력 시 이스케이프

```java
// DB에서 조회한 사용자 입력을 화면에 표시할 때
String userContent = diaryRepository.findById(id).getContent();
String safeContent = xssProtectionUtil.escapeHtml(userContent);
response.setContent(safeContent);
```

### 4. 컨텍스트별 적절한 검증

```java
// 일기 내용: XSS만 검증 (SQL은 JPA가 방어)
@SafeText(checkSqlInjection = false)
private String diaryContent;

// 검색어: 모든 검증
@SafeText
private String searchQuery;

// 파일명: Path Traversal만 검증
@SafeText(checkXss = false, checkSqlInjection = false)
private String filename;
```

## 🔄 업데이트 이력

| 날짜       | 버전  | 내용                                                |
| ---------- | ----- | --------------------------------------------------- |
| 2024-12-03 | 1.0.0 | 초기 구현 (XSS, SQL Injection, Path Traversal 방어) |

## 📚 참고 자료

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)

---

**🎯 핵심 요약**

- ✅ XSS 방어: Request Parameter/Header 필터링 + @SafeText 어노테이션
- ✅ SQL Injection 방어: JPA Prepared Statement + 패턴 검증
- ✅ Path Traversal 방어: 경로 문자 검증
- ✅ 다층 방어: Filter → Validation → Service → Repository
- ✅ 선언적 검증: @SafeText 어노테이션으로 간편한 적용
