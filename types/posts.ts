export type PostType = 'post' | 'story';
export type FileType = 'image' | 'video';
export type MediaType = 'IMAGE' | 'VIDEO';

export interface PostData {
  file: File;
  caption: string;
  postType: PostType;
  fileType: FileType;
}

export interface CreatePostRequest {
  caption?: string;
  postType: PostType;
  mediaType: MediaType;
  mediaUrl: string;
  userId: string;
}

export interface PostResponse {
  id: string;
  caption?: string;
  mediaUrl: string;
  mediaType: MediaType;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name?: string;
    avatar?: string;
  };
    _count: {
      likes: number;
      comments: number;
    };
}

export interface StoryResponse {
  id: string;
  caption?: string; // Alterado de string | undefined para string | null
  mediaUrl: string;
  mediaType: MediaType;
  userId: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name?: string; // Também ajustado para consistência
    avatar?: string; // Também ajustado para consistência
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  url: string;
  mediaType: MediaType;
}