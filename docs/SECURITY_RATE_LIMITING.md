# API Rate Limiting 가이드

## 📋 개요

본 문서는 MoodDisk 프로젝트에 구현된 API Rate Limiting 기능에 대해 설명합니다. Rate Limiting은 DDoS 공격, 브루트포스 공격, API 남용을 방지하는 핵심 보안 기능입니다.

## 🔐 Rate Limiting이란?

Rate Limiting은 특정 시간 동안 사용자가 보낼 수 있는 요청 수를 제한하는 기술입니다.

### 필요성

- **브루트포스 공격 방지**: 로그인 시도 횟수 제한
- **DDoS 공격 완화**: 대량 요청으로 인한 서버 다운 방지
- **리소스 보호**: 파일 업로드, DB 작업 등 리소스 집약적 작업 제한
- **공정한 사용**: 모든 사용자에게 공평한 서비스 제공
- **비용 절감**: 과도한 API 호출로 인한 클라우드 비용 절감

## 🛡️ 구현 방식

### 토큰 버킷 알고리즘 (Token Bucket Algorithm)

**Bucket4j** 라이브러리를 사용하여 토큰 버킷 알고리즘을 구현했습니다.

```
┌─────────────────┐
│   Token Bucket  │
│  [🪙🪙🪙🪙🪙]   │ ← 용량: 5개
│                 │
│  Refill Rate:   │
│  5 tokens/min   │
└─────────────────┘
        ↓
   요청 시마다
   토큰 1개 소비
        ↓
   토큰 없으면
   429 응답
```

**동작 원리:**

1. 각 클라이언트(IP)는 자신만의 버킷을 가짐
2. 버킷에는 일정 개수의 토큰이 있음
3. 요청할 때마다 토큰 1개 소비
4. 토큰이 없으면 요청 거부 (429 Too Many Requests)
5. 시간이 지나면 토큰 자동 리필

## 📊 Rate Limit 정책

### API 카테고리별 제한

| 카테고리     | 제한        | 이유                 |
| ------------ | ----------- | -------------------- |
| **인증 API** |
| 로그인       | 1분에 5회   | 브루트포스 공격 방지 |
| 회원가입     | 1분에 3회   | 스팸 계정 생성 방지  |
| 토큰 갱신    | 1분에 10회  | 토큰 갱신 남용 방지  |
| **일기 API** |
| 일기 작성    | 1분에 20회  | 스팸 방지            |
| 일기 수정    | 1분에 20회  | 정상 사용 허용       |
| 일기 조회    | 1분에 300회 | 정상 사용 허용       |
| **파일 API** |
| 파일 업로드  | 1분에 10회  | 리소스 남용 방지     |
| 프로필 수정  | 1분에 5회   | 스팸 방지            |
| **일반 API** |
| 기타 API     | 1분에 60회  | 일반적인 사용 허용   |
| 전체 요청    | 1분에 200회 | 글로벌 제한          |

### Rate Limit 타입 코드

```java
public enum RateLimitType {
    AUTH_LOGIN(5, Duration.ofMinutes(1)),
    AUTH_REGISTER(3, Duration.ofMinutes(1)),
    AUTH_TOKEN_REFRESH(10, Duration.ofMinutes(1)),

    DIARY_CREATE(20, Duration.ofMinutes(1)),
    DIARY_UPDATE(20, Duration.ofMinutes(1)),
    DIARY_READ(300, Duration.ofMinutes(1)),

    FILE_UPLOAD(10, Duration.ofMinutes(1)),
    PROFILE_UPDATE(5, Duration.ofMinutes(1)),

    GENERAL_API(60, Duration.ofMinutes(1)),
    GLOBAL(200, Duration.ofMinutes(1));
}
```

## 📁 구현 파일

### 1. RateLimitConfig.java ✨

```
위치: src/main/java/com/astro/mood/config/RateLimitConfig.java
역할: Rate Limit 정책 정의 및 버킷 관리
```

**주요 기능:**

- Rate Limit 타입별 정책 정의
- IP별 버킷 생성 및 캐싱
- 버킷 관리 (생성, 조회, 삭제)

### 2. RateLimitService.java

```
위치: src/main/java/com/astro/mood/service/ratelimit/RateLimitService.java
역할: Rate Limit 체크 및 클라이언트 식별
```

**주요 기능:**

- Rate Limit 체크 및 토큰 소비
- 클라이언트 IP 추출 (X-Forwarded-For 지원)
- 결과 객체 반환 (허용 여부, 남은 토큰, 재시도 시간)

### 3. RateLimitFilter.java

```
위치: src/main/java/com/astro/mood/security/filter/RateLimitFilter.java
역할: HTTP 요청 필터링 및 Rate Limit 적용
```

**주요 기능:**

- 요청 URI에 따라 Rate Limit 타입 결정
- Rate Limit 체크
- 429 응답 생성
- 정적 리소스 제외

### 4. SecurityConfig.java 통합

```
위치: src/main/java/com/astro/mood/config/SecurityConfig.java
```

**필터 체인 순서:**

```
SecurityThreatFilter → RateLimitFilter → JWTFilter
```

## 🔄 동작 흐름

```
클라이언트 요청
    ↓
SecurityThreatFilter
    ↓
RateLimitFilter
    ├─ URI 분석
    ├─ Rate Limit 타입 결정
    ├─ IP 추출
    └─ 버킷에서 토큰 소비 시도
         ↓
    ┌────┴────┐
    │         │
토큰 있음   토큰 없음
    │         │
    ↓         ↓
다음 필터   429 응답
    ↓         └─ Retry-After 헤더
JWTFilter
    ↓
Controller
```

## 📡 HTTP 응답 헤더

### 성공 응답 (200 OK)

```http
HTTP/1.1 200 OK
X-Rate-Limit-Limit: 60
X-Rate-Limit-Remaining: 45
```

### Rate Limit 초과 (429 Too Many Requests)

```http
HTTP/1.1 429 Too Many Requests
X-Rate-Limit-Limit: 5
X-Rate-Limit-Remaining: 0
X-Rate-Limit-Retry-After-Seconds: 42

{
  "error": "TOO_MANY_REQUESTS",
  "message": "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.",
  "retryAfterSeconds": 42,
  "status": 429
}
```

## 🚨 에러 처리

### 에러 코드

```java
TOO_MANY_REQUESTS(42900, HttpStatus.TOO_MANY_REQUESTS,
    "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.")
RATE_LIMIT_EXCEEDED(42901, HttpStatus.TOO_MANY_REQUESTS,
    "요청 제한을 초과했습니다.")
```

### 로그 예시

**정상 요청:**

```
DEBUG - ✅ Rate limit passed - IP: <IP_ADDRESS>, Type: DIARY_CREATE, Remaining: 7
```

**제한 초과:**

```
WARN  - 🚫 Rate limit exceeded - IP: <IP_ADDRESS>, Type: AUTH_LOGIN, Retry after: 45s
```

## 🔧 설정 및 커스터마이징

### Rate Limit 변경

**예시: 로그인 제한을 1분에 10회로 변경**

```java
// RateLimitConfig.java
AUTH_LOGIN(10, Duration.ofMinutes(1)),  // 5 → 10
```

**예시: 일기 작성을 5분에 20회로 변경**

```java
// RateLimitConfig.java
DIARY_CREATE(20, Duration.ofMinutes(5)),  // 10회/1분 → 20회/5분
```

### 새로운 Rate Limit 타입 추가

```java
// 1. RateLimitConfig.java에 타입 추가
public enum RateLimitType {
    // 기존 타입들...

    COMMENT_CREATE(30, Duration.ofMinutes(1)),  // 새로운 타입
}

// 2. RateLimitFilter.java에 매핑 추가
private RateLimitConfig.RateLimitType determineRateLimitType(String uri, String method) {
    // 기존 매핑들...

    if (uri.contains("/comment") && "POST".equals(method)) {
        return RateLimitConfig.RateLimitType.COMMENT_CREATE;
    }

    return RateLimitConfig.RateLimitType.GENERAL_API;
}
```

### 특정 경로 제외

```java
// RateLimitFilter.java
@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getRequestURI();

    // 새로운 경로 추가
    if (path.startsWith("/public/")) {
        return true;
    }

    return false;
}
```

## 🧪 테스트

### 수동 테스트

**curl로 Rate Limit 테스트:**

```bash
# 1. 정상 요청 (5회까지)
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"test123"}' \
       -i
  echo "Request $i completed"
  sleep 1
done

# 2. 6번째 요청 (429 응답 예상)
curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}' \
     -i
```

### 단위 테스트 예시

```java
@Test
void testRateLimit_ExceedsLimit() {
    // Given
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRequestURI("/api/auth/login");
    request.setMethod("POST");
    request.setRemoteAddr("<IP_ADDRESS>");

    // When: 제한(5회)보다 많은 요청
    for (int i = 0; i < 6; i++) {
        result = rateLimitService.checkRateLimit(request,
                 RateLimitConfig.RateLimitType.AUTH_LOGIN);
    }

    // Then: 6번째 요청은 거부되어야 함
    assertFalse(result.isAllowed());
    assertTrue(result.getRetryAfterSeconds() > 0);
}
```

## 📊 모니터링

### 주요 모니터링 지표

1. **Rate Limit 초과 횟수**

   - 로그: `🚫 Rate limit exceeded`
   - 높은 비율 = 공격 또는 정책 조정 필요

2. **IP별 차단 현황**

   - 특정 IP의 반복적인 차단 = 악의적 사용자

3. **API별 제한 도달률**

   - 정상 사용자도 자주 제한에 걸리면 정책 완화 검토

4. **버킷 캐시 크기**
   ```java
   rateLimitConfig.getBucketCount()
   ```
   - 너무 많으면 메모리 사용량 증가

### Grafana 대시보드 예시

```
┌─────────────────────────────────────┐
│ Rate Limit 초과 횟수 (시간별)        │
│ ▁▂▃▅▇█▇▅▃▂▁                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 상위 차단 IP                         │
│ <IP_ADDRESS>: 45회                  │
│ <IP_ADDRESS>: 32회                  │
└─────────────────────────────────────┘
```

## 🌐 프록시 및 로드밸런서 환경

### IP 추출 우선순위

RateLimitService는 다음 순서로 클라이언트 IP를 추출합니다:

1. `X-Forwarded-For`
2. `Proxy-Client-IP`
3. `WL-Proxy-Client-IP`
4. `HTTP_CLIENT_IP`
5. `HTTP_X_FORWARDED_FOR`
6. `request.getRemoteAddr()`

### Nginx 설정 예시

```nginx
location / {
    proxy_pass http://backend;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🚀 성능 최적화

### 인메모리 캐싱

현재 구현은 `ConcurrentHashMap`을 사용한 인메모리 방식입니다.

**장점:**

- 빠른 속도 (나노초 단위)
- 추가 인프라 불필요

**단점:**

- 서버 재시작 시 초기화
- 다중 서버 환경에서 각 서버가 독립적으로 제한

### Redis로 확장 (선택 사항)

분산 환경에서는 Redis 백엔드 사용을 권장합니다.

```gradle
// build.gradle
implementation 'com.bucket4j:bucket4j-redis:8.10.1'
implementation 'org.springframework.boot:spring-boot-starter-data-redis'
```

```java
// Redis 기반 Rate Limit 구현
@Bean
public ProxyManager<String> proxyManager(RedissonClient redisson) {
    return Bucket4j.extension(Redisson.class)
                   .proxyManagerForRedisson(redisson);
}
```

## 📝 클라이언트 대응 가이드

### 프론트엔드 처리

```typescript
// API 호출 시 Rate Limit 처리
try {
  const response = await fetch("/api/diary", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response.status === 429) {
    const error = await response.json();
    const retryAfter = error.retryAfterSeconds;

    // 사용자에게 알림
    alert(
      `너무 많은 요청이 발생했습니다. ${retryAfter}초 후에 다시 시도해주세요.`
    );

    // 자동 재시도 (선택)
    setTimeout(() => {
      // 재시도 로직
    }, retryAfter * 1000);
  }
} catch (error) {
  console.error("API Error:", error);
}
```

### 응답 헤더 활용

```typescript
// Rate Limit 정보 표시
const remaining = response.headers.get("X-Rate-Limit-Remaining");
const limit = response.headers.get("X-Rate-Limit-Limit");

console.log(`남은 요청: ${remaining}/${limit}`);
```

## 🔄 업데이트 이력

| 날짜       | 버전  | 내용                               |
| ---------- | ----- | ---------------------------------- |
| 2024-12-03 | 1.0.0 | 초기 구현 (Bucket4j 인메모리 방식) |

## 📚 참고 자료

- [Bucket4j Documentation](https://bucket4j.com/)
- [Rate Limiting Best Practices](https://www.nginx.com/blog/rate-limiting-nginx/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

**🎯 핵심 요약**

- ✅ 브루트포스 공격 방지: 로그인 1분에 5회
- ✅ DDoS 완화: API별 제한 적용
- ✅ 리소스 보호: 파일 업로드 제한
- ✅ 클라이언트 친화적: Retry-After 헤더 제공
- ✅ 확장 가능: Redis 백엔드로 전환 가능
