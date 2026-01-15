// packages/types/src/domain/user.ts
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

export interface UserActivity {
  id: string;
  type: string;
  description: string;
  color: string;
  date: string;
}
