// packages/mappers/src/userMapper.ts

// 타입 정의 (임시 - @mooddisk/types가 없으므로)
interface ApiUserInfo {
  userIdx: number;
  email: string;
  nickname: string;
  profileImage?: string;
  createdAt: string;
}

interface ApiUserActivity {
  createdAt: string;
  activityType: string;
  description: string;
  color: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

interface UserActivity {
  id: string;
  type: string;
  description: string;
  color: string;
  date: string;
}

/**
 * API UserInfo 응답을 프론트엔드 User 타입으로 변환
 */
export const mapApiUserInfoToUser = (apiUser: ApiUserInfo): User => {
  return {
    id: apiUser.userIdx.toString(),
    email: apiUser.email,
    name: apiUser.nickname,
    picture: apiUser.profileImage,
    createdAt: apiUser.createdAt,
  };
};

/**
 * API UserActivity 응답을 프론트엔드 UserActivity 타입으로 변환
 */
export const mapApiUserActivityToUserActivity = (
  apiActivity: ApiUserActivity
): UserActivity => {
  return {
    id: apiActivity.createdAt, // 고유 ID가 없으므로 createdAt 사용
    type: apiActivity.activityType,
    description: apiActivity.description,
    color: apiActivity.color,
    date: apiActivity.createdAt,
  };
};
