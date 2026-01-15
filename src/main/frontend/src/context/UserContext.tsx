import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { getUserStats } from '@mooddisk/api';
import { UserStats } from "@mooddisk/types/api/user";
import { useAuth } from "./AuthContext";

interface UserContextType {
  userIdx: number | null;
  nickname: string | null;
  profileImage: string | null;
  userStats: UserStats | null;
  setUserIdx: (userIdx: number | null) => void;
  setNickname: (nickname: string | null) => void;
  setProfileImage: (profileImage: string | null) => void;
  setUserStats: (stats: UserStats | null) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  
  const { userInfo, isLoggedIn } = useAuth();
  
  // AuthContext에서 사용자 정보를 가져오되, localStorage도 폴백으로 사용
  const [userIdx, setUserIdxState] = useState<number | null>(() => {
    if (userInfo?.loginIdx) return userInfo.loginIdx;
    const storedUserIdx = localStorage.getItem("userIdx");
    return storedUserIdx ? Number(storedUserIdx) : null;
  });

  const [nickname, setNicknameState] = useState<string | null>(() => {
    if (userInfo?.nickname) return userInfo.nickname;
    return localStorage.getItem("nickname") || null;
  });

  const [profileImage, setProfileImageState] = useState<string | null>(() => {
    if (userInfo?.profileImage) return userInfo.profileImage;
    const storedImage = localStorage.getItem("profileImage");
    return storedImage && storedImage !== "null" ? storedImage : null;
  });

  const [userStats, setUserStatsState] = useState<UserStats | null>(null);

  // userIdx 업데이트 함수
  const setUserIdx = useCallback((newUserIdx: number | null) => {
    setUserIdxState(newUserIdx);
    if (newUserIdx !== null) {
      localStorage.setItem("userIdx", newUserIdx.toString());
    } else {
      localStorage.removeItem("userIdx");
    }
  }, []);

  // nickname 업데이트 함수
  const setNickname = useCallback((newNickname: string | null) => {
    setNicknameState(newNickname);
    if (newNickname !== null) {
      localStorage.setItem("nickname", newNickname);
    } else {
      localStorage.removeItem("nickname");
    }
  }, []);

  // profileImage 업데이트 함수
  const setProfileImage = useCallback((newProfileImage: string | null) => {
    setProfileImageState(newProfileImage);
    if (newProfileImage !== null) {
      localStorage.setItem("profileImage", newProfileImage);
    } else {
      localStorage.removeItem("profileImage");
    }
  }, []);

  // userStats 업데이트 함수
  const setUserStats = useCallback((newUserStats: UserStats | null) => {
    setUserStatsState(newUserStats);
  }, []);

  // 사용자 정보 초기화 함수
  const clearUser = useCallback(() => {
    setUserIdxState(null);
    setNicknameState(null);
    setProfileImageState(null);
    setUserStatsState(null);
    localStorage.removeItem("userIdx");
    localStorage.removeItem("nickname");
    localStorage.removeItem("profileImage");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
  }, []);

  // AuthContext의 userInfo가 변경되면 UserContext도 동기화
  useEffect(() => {
    if (userInfo) {
      setUserIdxState(userInfo.loginIdx);
      setNicknameState(userInfo.nickname);
      setProfileImageState(userInfo.profileImage || null);
    }
  }, [userInfo]);

  // 사용자 통계 정보 로드
  useEffect(() => {
    const loadUserStats = async () => {
      if (!userIdx || userStats || !isLoggedIn) return; // 로그인되지 않은 경우 스킵
      
      try {
        const response = await getUserStats(userIdx);
        setUserStatsState(response.data);
      } catch (error) {
        console.error('사용자 통계 로드 실패:', error);
      }
    };

    loadUserStats();
  }, [userIdx, userStats, isLoggedIn]);

  const value: UserContextType = {
    userIdx,
    nickname,
    profileImage,
    userStats,
    setUserIdx,
    setNickname,
    setProfileImage,
    setUserStats,
    clearUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}; 