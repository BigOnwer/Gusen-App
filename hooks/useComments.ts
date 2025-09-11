// hooks/useComments.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface UseCommentsOptions {
  apiBaseUrl?: string;
}

interface UseCommentsReturn {
  loading: boolean;
  submitting: boolean;
  comments: Record<string, Comment[]>;
  loadComments: (postId: string, page?: number) => Promise<void>;
  addComment: (postId: string, text: string, userId: string) => Promise<Comment | null>;
  deleteComment: (commentId: string, postId: string, userId: string) => Promise<boolean>;
  clearComments: (postId: string) => void;
}

export const useComments = ({ 
  apiBaseUrl = '/api' 
}: UseCommentsOptions = {}): UseCommentsReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

  // Carregar comentários de um post
  const loadComments = useCallback(async (postId: string, page: number = 1): Promise<void> => {
    setLoading(true);
    try {
      const url = new URL(`${apiBaseUrl}/comments`, window.location.origin);
      url.searchParams.append('postId', postId);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '20');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CommentsResponse> = await response.json();

      if (result.success && result.data) {
        const newComments = result.data.comments;
        
        setComments(prev => ({
          ...prev,
          [postId]: page === 1 ? newComments : [...(prev[postId] || []), ...newComments]
        }));
      } else {
        throw new Error(result.error || 'Erro ao carregar comentários');
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  // Adicionar novo comentário
  const addComment = useCallback(async (
    postId: string, 
    text: string, 
    userId: string
  ): Promise<Comment | null> => {
    if (!text.trim()) return null;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          postId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ comment: Comment; totalComments: number }> = await response.json();

      if (result.success && result.data) {
        const { comment } = result.data;

        // Adicionar comentário ao início da lista
        setComments(prev => ({
          ...prev,
          [postId]: [comment, ...(prev[postId] || [])]
        }));

        toast.success('Comentário adicionado!');
        return comment;
      } else {
        throw new Error(result.error || 'Erro ao adicionar comentário');
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao comentar: ${errorMessage}`);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [apiBaseUrl]);

  // Deletar comentário
  const deleteComment = useCallback(async (
    commentId: string, 
    postId: string, 
    userId: string
  ): Promise<boolean> => {
    try {
      const url = new URL(`${apiBaseUrl}/comments`, window.location.origin);
      url.searchParams.append('commentId', commentId);
      url.searchParams.append('userId', userId);

      const response = await fetch(url.toString(), {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ totalComments: number }> = await response.json();

      if (result.success) {
        // Remover comentário da lista
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
        }));

        toast.success('Comentário removido!');
        return true;
      } else {
        throw new Error(result.error || 'Erro ao deletar comentário');
      }
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      toast.error('Erro ao deletar comentário');
      return false;
    }
  }, [apiBaseUrl]);

  // Limpar comentários de um post
  const clearComments = useCallback((postId: string): void => {
    setComments(prev => {
      const newComments = { ...prev };
      delete newComments[postId];
      return newComments;
    });
  }, []);

  return {
    loading,
    submitting,
    comments,
    loadComments,
    addComment,
    deleteComment,
    clearComments
  };
};