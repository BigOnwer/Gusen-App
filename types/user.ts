// @/types/user.ts
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen: Date ;
  isVerified: boolean;
  bio: string | null;
  avatar: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  isFollowing?: boolean; // Optional for when checking follow status
  
  // Optional relational data that might be included depending on the query
  posts?: Array<{
    id: string;
    caption: string | null;
    mediaUrl: string;
    mediaType: string;
    createdAt: string;
    _count: {
      likes: number;
      comments: number;
    };
  }>;
  
  followers?: Array<{
    followerId: string;
    follower: {
      id: string;
      username: string;
      name: string | null;
      avatar: string | null;
    };
  }>;
  
  following?: Array<{
    followingId: string;
    following: {
      id: string;
      username: string;
      name: string | null;
      avatar: string | null;
    };
  }>;
  
  _count?: {
    followers: number;
    following: number;
    posts: number;
  };
}

export interface EditFormData {
  name: string;
  bio: string;
}
