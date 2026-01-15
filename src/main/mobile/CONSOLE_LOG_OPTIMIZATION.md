# Console.log 최적화 설정

## 개요

프로덕션 빌드에서 `console.log`를 자동으로 제거하여 성능을 최적화합니다.

## 설정 내용

### 1. Babel 플러그인 설정

- `babel-plugin-transform-remove-console` 설치
- `babel.config.js`에서 프로덕션 빌드 시에만 활성화
- `console.error`와 `console.warn`은 유지 (중요한 에러 로그 보존)

### 2. 빌드 스크립트

```bash
# 개발 환경 (console.log 유지)
yarn start
yarn android
yarn ios

# 프로덕션 빌드 (console.log 제거)
yarn build:android          # 디바이스에 프로덕션 빌드
yarn build:android:release  # 릴리즈 빌드 (더 최적화됨)
yarn build:ios
yarn build:web
```

## 동작 방식

### 개발 환경

```typescript
console.log("🚀 데이터 로드 완료"); // ✅ 출력됨
console.error("에러 발생"); // ✅ 출력됨
console.warn("경고"); // ✅ 출력됨
```

### 프로덕션 빌드

```typescript
console.log("🚀 데이터 로드 완료"); // ❌ 제거됨
console.error("에러 발생"); // ✅ 유지됨
console.warn("경고"); // ✅ 유지됨
```

## 효과

### 성능 개선

- **번들 크기 감소**: console.log 제거로 JavaScript 파일 크기 감소
- **런타임 성능 향상**: 프로덕션에서 불필요한 로그 출력 제거
- **메모리 사용량 감소**: 로그 문자열과 객체 참조 제거

### 개발 경험

- **개발 중**: 모든 로그가 정상 출력되어 디버깅 용이
- **프로덕션**: 깔끔한 로그 출력으로 성능 최적화

## 주의사항

1. **중요한 로그는 console.error/warn 사용**
2. **프로덕션 빌드 시에만 적용**
3. **기존 **DEV** 조건과 함께 사용 가능**

## 테스트 방법

```bash
# 개발 빌드 테스트
yarn expo run:android --device
# → console.log 출력됨

# 프로덕션 빌드 테스트
yarn build:android
# → console.log 제거됨

# 릴리즈 빌드 테스트 (더 최적화됨)
yarn build:android:release
# → console.log 제거됨 + 추가 최적화
```
