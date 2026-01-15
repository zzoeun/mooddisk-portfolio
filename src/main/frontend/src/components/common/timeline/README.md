# Timeline Components

공통 타임라인 컴포넌트들을 제공합니다. 일기, 챌린지 커뮤니티 등 다양한 곳에서 재사용할 수 있습니다.

## Components

### GenericTimeline

기본 타임라인 컴포넌트입니다. 다양한 데이터 타입을 지원하며, 커스터마이징이 가능합니다.

### TimelineActions

타임라인 아이템의 액션 버튼(수정, 삭제 등)을 렌더링합니다.

### TimelineAvatar

타임라인 아이템의 아바타를 렌더링합니다.

### ImageModal

이미지 갤러리 모달을 제공합니다.

## Usage

### 기본 사용법

```tsx
import { GenericTimeline, TimelineItem } from "../common/timeline";

const items: TimelineItem[] = [
  {
    id: "1",
    content: "첫 번째 게시글",
    createdAt: "2024-01-01T10:00:00",
    author: {
      name: "사용자1",
      avatar: "/avatar1.jpg",
    },
  },
];

<GenericTimeline items={items} />;
```

### 커스텀 아바타

```tsx
const renderCustomAvatar = (item: TimelineItem) => (
  <EmotionPixel emotion="happy" size="md" />
);

<GenericTimeline items={items} renderAvatar={renderCustomAvatar} />;
```

### 커스텀 액션

```tsx
const renderCustomActions = (item: TimelineItem) => (
  <TimelineActions
    item={item}
    isOpen={openMenuId === item.id}
    onToggle={() => setOpenMenuId(item.id)}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
);

<GenericTimeline items={items} renderActions={renderCustomActions} />;
```

## TimelineItem Interface

```tsx
interface TimelineItem {
  id: string;
  content: string;
  imageUrls?: string[];
  createdAt: string;
  author?: {
    name: string;
    avatar?: string;
    emotion?: string;
  };
  actions?: {
    onEdit?: (item: TimelineItem) => void;
    onDelete?: (itemId: string) => void;
  };
}
```

## Examples

### DiaryTimeline

일기 전용 타임라인으로, EmotionPixel을 아바타로 사용합니다.

### ChallengeTimeline

챌린지 커뮤니티 전용 타임라인으로, 여러 사용자의 댓글을 표시합니다.
