// lib/postService.ts
import { PostData, ApiResponse, PostResponse, UploadResponse } from '@/types/posts';

class PostService {
  private baseUrl = '/api';

  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData
    });

    const result: ApiResponse<UploadResponse> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro no upload');
    }

    return result.data!;
  }

  async createPost(postData: PostData, userId: string): Promise<PostResponse> {
    try {
      // 1. Upload do arquivo
      const uploadResult = await this.uploadFile(postData.file);

      // 2. Criar post/story
      const createPostData = {
        caption: postData.caption,
        postType: postData.postType,
        mediaType: uploadResult.mediaType,
        mediaUrl: uploadResult.url,
        userId
      };

      const response = await fetch(`${this.baseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createPostData)
      });

      const result: ApiResponse<PostResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar post');
      }

      return result.data!;

    } catch (error) {
      console.error('Erro no serviço de posts:', error);
      throw error;
    }
  }

  async getPosts(userId?: string, page = 1, limit = 10): Promise<PostResponse[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (userId) {
      params.set('userId', userId);
    }

    const response = await fetch(`${this.baseUrl}/posts?${params}`);
    const result: ApiResponse<PostResponse[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar posts');
    }

    return result.data || [];
  }

  async getStories(userId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    
    if (userId) {
      params.set('userId', userId);
    }

    const response = await fetch(`${this.baseUrl}/stories?${params}`);
    const result: ApiResponse<any[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao buscar stories');
    }

    return result.data || [];
  }
}

export const postService = new PostService();

// Hook personalizado para usar no React
export function usePostService() {
  return {
    createPost: postService.createPost.bind(postService),
    getPosts: postService.getPosts.bind(postService),
    getStories: postService.getStories.bind(postService)
  };
}