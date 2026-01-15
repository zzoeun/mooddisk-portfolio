# @mooddisk Packages

이 폴더는 mooddisk 프로젝트의 공유 패키지들을 포함합니다.

## 📦 패키지 구조

```
packages/
├── api/          # API 통신 로직
│   ├── src/      # TypeScript 소스 파일들
│   └── dist/     # 컴파일된 JavaScript 파일들
├── types/        # TypeScript 타입 정의
│   ├── src/
│   │   ├── api/      # API 응답 타입들
│   │   ├── domain/   # 도메인 타입들
│   │   └── index.ts  # 모든 타입 통합 export
│   └── dist/     # 컴파일된 타입 정의 파일들
├── utils/        # 유틸리티 함수들
│   ├── src/      # TypeScript 소스 파일들
│   └── dist/     # 컴파일된 JavaScript 파일들
├── mappers/      # API 응답 변환 함수들
│   ├── src/      # TypeScript 소스 파일들
│   └── dist/     # 컴파일된 JavaScript 파일들
└── hooks/        # React 훅들
    ├── src/      # TypeScript 소스 파일들
    └── dist/     # 컴파일된 JavaScript 파일들
```

## 🚀 사용법

### 웹 환경

```typescript
import { getUserInfo } from "@mooddisk/api";
import { UserEntry, DiaryEntry } from "@mooddisk/types";
import { formatDate } from "@mooddisk/utils";
import { mapApiUserToUserEntry } from "@mooddisk/mappers";
import { useErrorHandler } from "@mooddisk/hooks";
```

### 모바일 환경

```typescript
import { getUserInfo } from "@mooddisk/api/index.native";
import { UserEntry, DiaryEntry } from "@mooddisk/types";
import { formatDate } from "@mooddisk/utils";
import { mapApiUserToUserEntry } from "@mooddisk/mappers";
import { useErrorHandler } from "@mooddisk/hooks";
```

> ⚠️ **중요**: 모바일에서는 반드시 `@mooddisk/api/index.native`를 사용해야 합니다. `@mooddisk/api`를 사용하면 `navigator.origin` 오류가 발생합니다.

## 🛠️ 개발 명령어

### 패키지 빌드

```bash
# 모든 패키지 빌드
yarn build:packages

# 패키지별 빌드 (순서 중요!)
yarn workspace @mooddisk/types build
yarn workspace @mooddisk/utils build
yarn workspace @mooddisk/mappers build
yarn workspace @mooddisk/api build
yarn workspace @mooddisk/hooks build
```

### 개발 모드

```bash
# 모든 패키지 감시 모드
yarn dev:packages

# 프론트엔드 개발 (패키지 자동 빌드)
yarn dev:frontend

# 모바일 개발
yarn dev:mobile
```

### 정리

```bash
# 모든 dist 파일 삭제
yarn clean:packages

# 전체 정리
yarn clean
```

## 📋 개발 가이드라인

### 1. 패키지 수정 시

1. TypeScript 파일 수정
2. `yarn build:packages` 실행 (또는 `yarn dev:packages`로 자동 빌드)
3. 변경사항이 자동으로 반영됨

### 2. 새로운 패키지 추가 시

1. `packages/` 폴더에 새 패키지 생성
2. `package.json`에 workspace 추가
3. 빌드 스크립트에 새 패키지 추가

### 3. 환경별 사용

- **웹**: `@mooddisk/package-name` (dist 파일 사용)
- **모바일**: `@mooddisk/package-name/index.native` (TypeScript 직접 사용)

### 4. 패키지별 상세 가이드

#### @mooddisk/types

- **API 타입**: `ApiChallenge`, `ApiDiary`, `ApiCounseling`, `ApiUser`
- **도메인 타입**: `ChallengeEntry`, `DiaryEntry`, `CounselingEntry`, `UserEntry`
- **사용법**: `import { DiaryEntry } from "@mooddisk/types";`

#### @mooddisk/mappers

- **매퍼 함수**: `mapApiDiaryToDiaryEntry`, `mapApiChallengeToChallengeEntry` 등
- **사용법**: `import { mapApiDiaryToDiaryEntry } from "@mooddisk/mappers";`

#### @mooddisk/api

- **API 함수**: `getAllDiaries`, `createDiary`, `updateDiary` 등
- **웹 사용법**: `import { getAllDiaries } from "@mooddisk/api";`
- **모바일 사용법**: `import { getAllDiaries } from "@mooddisk/api/index.native";`

## 💡 실제 사용 예시

### 일기 목록 가져오기

```typescript
import { getAllDiaries } from "@mooddisk/api";
import { DiaryEntry } from "@mooddisk/types";
import { useErrorHandler } from "@mooddisk/hooks";

const DiaryList = () => {
  const { handleError } = useErrorHandler();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        const diaryList = await getAllDiaries();
        setDiaries(diaryList);
      } catch (error) {
        handleError(error);
      }
    };

    fetchDiaries();
  }, []);

  return (
    <div>
      {diaries.map((diary) => (
        <div key={diary.id}>{diary.content}</div>
      ))}
    </div>
  );
};
```

### 챌린지 참여하기

```typescript
import { joinChallenge } from "@mooddisk/api";
import { ChallengeEntry } from "@mooddisk/types";
import { useErrorHandler } from "@mooddisk/hooks";

const ChallengeCard = ({ challenge }: { challenge: ChallengeEntry }) => {
  const { handleError } = useErrorHandler();

  const handleJoin = async () => {
    try {
      await joinChallenge(challenge.id);
      // 성공 처리
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      <h3>{challenge.title}</h3>
      <button onClick={handleJoin}>참여하기</button>
    </div>
  );
};
```

## 🔧 문제 해결

### 빌드 오류 시

```bash
# 패키지 정리 후 재빌드
yarn clean:packages
yarn build:packages
```

### 타입 오류 시

```bash
# 타입 체크만 실행
yarn workspace @mooddisk/types type-check
yarn workspace @mooddisk/api type-check
yarn workspace @mooddisk/mappers type-check
```

### 의존성 문제 시

```bash
# node_modules 재설치
yarn install
```
