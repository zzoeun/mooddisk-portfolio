# 보안 배포 가이드

## SQL 로깅 비활성화 설정

### 프로덕션 환경에서 SQL 로깅이 비활성화되는 방법

1. **프로파일 기반 설정**

   - 개발 환경: `application.yaml` (SQL 로깅 활성화)
   - 프로덕션 환경: `application-prod.yaml` (SQL 로깅 비활성화)

2. **JpaConfig 동적 설정**

   - `isProductionProfile()` 메서드로 현재 프로파일 확인
   - 프로덕션 프로파일일 때 SQL 로깅 비활성화

3. **Docker 배포 시 자동 적용**
   - GitHub Actions에서 `SPRING_PROFILES_ACTIVE=prod` 환경변수 설정
   - 프로덕션 배포 시 자동으로 SQL 로깅 비활성화

### 로컬 테스트 방법

#### 개발 환경 (SQL 로깅 활성화)

```bash
./gradlew bootRun
# 또는
java -jar build/libs/mood-0.0.1-SNAPSHOT.jar
```

#### 프로덕션 환경 시뮬레이션 (SQL 로깅 비활성화)

```bash
./gradlew bootRun --args='--spring.profiles.active=prod'
# 또는
java -jar build/libs/mood-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 확인 방법

1. **애플리케이션 시작 로그 확인**

   ```bash
   # 프로덕션 프로파일이 활성화되었는지 확인
   docker logs mooddisk-backend | grep "Active profiles"
   # 예상 출력: Active profiles: [prod]

   # Hibernate 설정이 올바르게 적용되었는지 확인
   docker logs mooddisk-backend | grep "Hibernate properties"
   # 예상 출력: Setting production Hibernate properties - SQL logging disabled
   ```

2. **SQL 로그 비활성화 확인**

   ```bash
   # SQL 관련 로그가 출력되지 않는지 확인
   docker logs mooddisk-backend | grep -i "hibernate\|sql\|select\|insert\|update\|delete"
   # 아무것도 출력되지 않아야 함
   ```

3. **환경변수 확인**
   ```bash
   echo $SPRING_PROFILES_ACTIVE
   # 프로덕션에서는 "prod" 출력
   ```

## CORS 보안 강화 설정

### 프로덕션 환경에서 CORS 정책 강화

1. **프로파일 기반 CORS 설정**

   - 개발 환경: 관대한 CORS 정책 (localhost 포함)
   - 프로덕션 환경: 엄격한 CORS 정책 (허용된 도메인만)

2. **SecurityConfig 동적 설정**

   - `isProductionProfile()` 메서드로 현재 프로파일 확인
   - 프로덕션 프로파일일 때 제한된 Origin만 허용

3. **설정 파일별 CORS 정책**
   - `application.yaml`: 개발용 관대한 정책
   - `application-prod.yaml`: 프로덕션용 엄격한 정책

### CORS 정책 비교

#### 개발 환경 (application.yaml)

```yaml
cors:
  allowed-origins:
    - http://localhost:3000
    - http://localhost:8080
    - http://localhost:3001
    - https://mooddisk.com
    - https://www.mooddisk.com
    - https://api.mooddisk.com
  max-age: 3600 # 1시간
```

#### 프로덕션 환경 (application-prod.yaml)

```yaml
cors:
  allowed-origins:
    - https://mooddisk.com
    - https://www.mooddisk.com
  max-age: 1800 # 30분 (더 짧은 캐시)
```

### CORS 보안 확인 방법

1. **프로덕션 CORS 정책 적용 확인**

   ```bash
   docker logs mooddisk-backend | grep "CORS policy"
   # 예상 출력: Production CORS policy applied - restricted origins only
   ```

2. **허용되지 않은 Origin에서의 요청 테스트**
   ```bash
   # 다른 도메인에서 API 요청 시 CORS 에러 발생해야 함
   curl -H "Origin: https://malicious-site.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        https://api.mooddisk.com/api/auth/login
   ```

### 보안 효과

- ✅ 프로덕션에서 민감한 데이터 로그 노출 방지
- ✅ 성능 향상 (SQL 로깅 오버헤드 제거)
- ✅ 로그 파일 크기 감소
- ✅ 개발 환경에서는 디버깅을 위한 SQL 로깅 유지
- ✅ **CORS 공격 방지**: 허용되지 않은 도메인에서의 요청 차단
- ✅ **Origin 제한**: 프로덕션에서는 mooddisk.com 도메인만 허용
- ✅ **캐시 시간 단축**: 프로덕션에서 더 짧은 preflight 캐시 시간

### 문제 해결

#### CORS 에러가 발생하는 경우

1. **프로덕션에서 허용되지 않은 Origin 사용**

   ```bash
   # 현재 허용된 Origin 확인
   docker logs mooddisk-backend | grep "CORS policy"

   # 허용된 도메인만 사용:
   # - https://mooddisk.com
   # - https://www.mooddisk.com
   ```

2. **개발 환경에서 localhost 접근 불가**

   ```bash
   # 개발 환경에서는 다음 Origin들이 허용됨:
   # - http://localhost:3000
   # - http://localhost:8080
   # - http://localhost:3001
   ```

3. **CORS 설정이 적용되지 않는 경우**

   ```bash
   # 프로파일 확인
   docker logs mooddisk-backend | grep "Active profiles"

   # CORS 정책 메시지 확인
   docker logs mooddisk-backend | grep "CORS policy"
   ```

#### SQL 로그가 여전히 출력되는 경우

1. **프로파일 설정 확인**

   ```bash
   # 컨테이너 내부에서 환경변수 확인
   docker exec mooddisk-backend env | grep SPRING_PROFILES_ACTIVE
   # "prod"가 출력되어야 함
   ```

2. **애플리케이션 로그에서 프로파일 감지 확인**

   ```bash
   docker logs mooddisk-backend | grep "Active profiles"
   # [prod]가 출력되어야 함
   ```

3. **Hibernate 속성 설정 확인**

   ```bash
   docker logs mooddisk-backend | grep "Hibernate properties"
   # "SQL logging disabled"가 출력되어야 함
   ```

4. **로그 레벨 확인**
   ```bash
   docker logs mooddisk-backend | grep "logging.level"
   # org.hibernate.SQL: WARN이 설정되어야 함
   ```

## 에러 메시지 일반화 설정

### 프로덕션 환경에서 에러 메시지 보안 강화

1. **에러 메시지 일반화**

   - 프로덕션에서는 상세한 에러 메시지 대신 일반적인 메시지 사용
   - 민감한 정보 노출 방지

2. **스택 트레이스 비활성화**

   - 프로덕션에서는 스택 트레이스 완전 비활성화
   - 서버 내부 구조 정보 노출 방지

3. **로그 마스킹**
   - 이메일, 전화번호, JWT 토큰, AWS 키 등 민감한 정보 자동 마스킹
   - 데이터베이스 URL, S3 버킷 정보 등 인프라 정보 보호

### 에러 메시지 비교

#### 개발 환경

```json
{
  "code": 50002,
  "message": "S3 버킷 'mooddisk-upload-bucket'에 파일 업로드에 실패했습니다."
}
```

#### 프로덕션 환경

```json
{
  "code": 50002,
  "message": "서버 오류가 발생했습니다."
}
```

### 보안 효과

- ✅ **정보 노출 방지**: 상세한 에러 메시지로 인한 시스템 정보 노출 차단
- ✅ **스택 트레이스 보호**: 서버 내부 구조 및 코드 경로 정보 보호
- ✅ **민감 정보 마스킹**: 로그에서 개인정보 및 인프라 정보 자동 마스킹
- ✅ **공격 벡터 제거**: 에러 메시지를 통한 시스템 탐지 방지

### 주의사항

- 프로덕션 배포 시 반드시 `SPRING_PROFILES_ACTIVE=prod` 설정 확인
- 로컬에서 프로덕션 프로파일 테스트 시 데이터베이스 스키마가 최신 상태인지 확인
- 프로덕션에서는 `hibernate.ddl-auto: validate` 사용 (스키마 자동 변경 방지)
- 디버그 로그는 프로덕션 배포 후 제거 권장
- 에러 메시지 일반화로 인한 디버깅 어려움 고려 (개발 환경에서는 상세 메시지 유지)
