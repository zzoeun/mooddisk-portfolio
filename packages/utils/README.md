# @mooddisk/utils

MoodDisk 애플리케이션을 위한 유틸리티 함수 모음입니다.

## 설치

```bash
yarn add @mooddisk/utils
```

## 사용법

```typescript
import {
  createFormData,
  getErrorMessage,
  splitTextByLineBreaks,
  emotionMapping,
  formatDateString,
} from "@mooddisk/utils";
```

## 포함된 유틸리티

### API 유틸리티 (`apiUtils`)

- `createFormData()` - FormData 생성
- `createDiaryFormData()` - 일기용 FormData 생성
- `getErrorMessage()` - API 에러 메시지 추출
- `handleApiError()` - API 에러 처리

### UI 유틸리티 (`uiUtils`)

- `splitTextByLineBreaks()` - 텍스트 줄바꿈 처리
- `convertKoreanDateToApiFormat()` - 한국어 날짜를 API 형식으로 변환
- `formatDateString()` - 날짜 문자열 포맷팅
- `isSameMonth()` - 같은 월인지 확인
- `validateFileSize()` - 파일 크기 검증
- `formatFileSize()` - 파일 크기 포맷팅
- `cn()` - 클래스명 유틸리티 (clsx + tailwind-merge)

### 감정 유틸리티 (`emotionUtils`)

- `emotionMapping` - 감정 매핑 객체
- `getEmotionFromIdx()` - 인덱스로 감정 가져오기
- `getEmotionDisplayName()` - 감정 표시명 가져오기
- `getEmotionIdxFromString()` - 문자열로 감정 인덱스 가져오기
- `getEmotionFilterOptions()` - 감정 필터 옵션 가져오기

### 페이지네이션 유틸리티 (`paginationUtils`)

- `handlePaginationResponse()` - 페이지네이션 응답 처리

### 스토리지 유틸리티 (`storageUtils`)

- `getUserData()` - 사용자 데이터 가져오기
- `setUserData()` - 사용자 데이터 저장
- `clearUserData()` - 사용자 데이터 삭제

## 개발

```bash
# 의존성 설치
yarn install

# 빌드
yarn build

# 개발 모드 (감시)
yarn dev
```
