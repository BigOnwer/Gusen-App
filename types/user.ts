export interface User {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  isOnline: boolean;
  followers: number;
  isVerified: boolean;
  isFollowing: boolean;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface EditFormData {
  name: string;
  bio: string;
}
