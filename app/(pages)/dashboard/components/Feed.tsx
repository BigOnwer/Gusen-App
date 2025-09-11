import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Smile, Send, User, Trash } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { API } from '@/lib/axios';
import { toast } from 'sonner';

// Tipos TypeScript
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

interface Post {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface CreateCommentRequest {
  text: string;
  postId: string;
  userId: string;
}

interface LikeRequest {
  postId: string;
  userId: string;
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

// Função para formatar tempo
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  return date.toLocaleDateString('pt-BR');
};

// Props do componente principal
interface InstagramFeedProps {
  userId?: string;
  apiBaseUrl?: string;
}

// Componente principal
const InstagramFeed: React.FC<InstagramFeedProps> = ({ 
  userId,
  apiBaseUrl = '/api'
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [fullComments, setFullComments] = useState<Record<string, Comment[]>>({});
  const router = useRouter();

  const { data: session, status } = useSession();

  // Buscar posts da API
  const fetchPosts = async (page: number = 1, append: boolean = false): Promise<void> => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const url = new URL(`${apiBaseUrl}/posts`, window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '10');

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Post[]> = await response.json();

      if (result.success && result.data) {
        const newPosts = result.data;
        if (append) {
          setPosts(prev => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }
        
        // Se retornou menos que o limite, não há mais posts
        if (newPosts.length < 10) {
          setHasMore(false);
        }
        
        setError(null);
      } else {
        setError(result.error || 'Erro ao carregar posts');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão com a API';
      setError(errorMessage);
      console.error('Erro ao buscar posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Carregar posts inicial e likes do usuário
  useEffect(() => {
    fetchPosts();
    loadUserLikes();
  }, [userId]);

  // Carregar likes existentes do usuário
  const loadUserLikes = async (): Promise<void> => {
    if (!userId) {
      console.warn('⚠️ Usuário não logado, não carregando likes');
      return;
    }

    try {
      const url = `${apiBaseUrl}/users/${userId}/likes`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result: ApiResponse<{postIds: string[]}> = await response.json();
        
        if (result.success && result.data) {
          setLikedPosts(new Set(result.data.postIds));
        }
      }
    } catch (err) {
      console.error('❌ Erro ao carregar likes do usuário:', err);
    }
  };

  // Buscar todos os comentários de um post
  const loadAllComments = async (postId: string): Promise<void> => {
    if (fullComments[postId]) return; // Já carregados

    setLoadingComments(true);
    try {
      const url = new URL(`${apiBaseUrl}/comments`, window.location.origin);
      url.searchParams.append('postId', postId);
      url.searchParams.append('limit', '50'); // Carregar mais comentários

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<CommentsResponse> = await response.json();

      if (result.success && result.data) {
        setFullComments(prev => ({
          ...prev,
          [postId]: result.data!.comments
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoadingComments(false);
    }
  };

  // Toggle de curtida
  const toggleLike = async (postId: string): Promise<void> => {
    const isCurrentlyLiked = likedPosts.has(postId);
    const currentUserId = session?.user.id;

    if (!currentUserId) {
      toast.error('Você precisa estar logado para curtir');
      return;
    }

    try {
      const url = `${apiBaseUrl}/posts/${postId}/like`;
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          userId: currentUserId,
          postId: postId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar like');
      }

      // Atualizar estado local
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (isCurrentlyLiked) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });

      // Atualizar contagem de likes
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              _count: {
                ...post._count,
                likes: result.data?.likesCount || post._count.likes + (isCurrentlyLiked ? -1 : 1)
              }
            }
          : post
      ));

    } catch (err) {
      console.error('❌ Erro ao curtir post:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao curtir post: ${errorMessage}`);
    }
  };

  const toggleSave = (postId: string): void => {
    setSavedPosts(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });
  };

  // Criar comentário
  const handleComment = async (postId: string): Promise<void> => {
    if (!newComment.trim()) return;
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para comentar');
      return;
    }

    setSubmittingComment(true);
    try {
      const commentData: CreateCommentRequest = {
        text: newComment.trim(),
        postId,
        userId: session.user.id
      };

      const response = await fetch(`${apiBaseUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ comment: Comment; totalComments: number }> = await response.json();

      if (result.success && result.data) {
        const { comment, totalComments } = result.data;

        // Atualizar os comentários do post nos posts
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                comments: [comment, ...(post.comments || []).slice(0, 2)], // const displayComments = isShowingAll ? allComments : (post.comments || []).slice(0, 2);
                _count: { ...post._count, comments: totalComments }
              }
            : post
        ));

        // Se estiver mostrando todos os comentários, adicionar à lista completa
        if (fullComments[postId]) {
          setFullComments(prev => ({
            ...prev,
            [postId]: [comment, ...prev[postId]]
          }));
        }

        setNewComment('');
        toast.success('Comentário adicionado!');
      } else {
        throw new Error(result.error || 'Erro ao adicionar comentário');
      }
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao comentar: ${errorMessage}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Deletar comentário
  const handleDeleteComment = async (commentId: string, postId: string): Promise<void> => {
    if (!session?.user?.id) return;

    try {
      const url = new URL(`${apiBaseUrl}/comments`, window.location.origin);
      url.searchParams.append('commentId', commentId);
      url.searchParams.append('userId', session.user.id);

      const response = await fetch(url.toString(), {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<{ totalComments: number }> = await response.json();

      if (result.success && result.data) {
        // Atualizar posts
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                comments: (post.comments || []).filter(c => c.id !== commentId),
                _count: { ...post._count, comments: result.data!.totalComments }
              }
            : post
        ));

        // Atualizar comentários completos se carregados
        if (fullComments[postId]) {
          setFullComments(prev => ({
            ...prev,
            [postId]: prev[postId].filter(c => c.id !== commentId)
          }));
        }

        toast.success('Comentário removido!');
      }
    } catch (err) {
      console.error('Erro ao deletar comentário:', err);
      toast.error('Erro ao deletar comentário');
    }
  };

  const loadMorePosts = (): void => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Obter comentários para exibição (da API ou completos se carregados)
  const getPostComments = (postId: string): Comment[] => {
    return fullComments[postId] || [];
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, postId: string): void => {
    if (e.key === "Enter" && !submittingComment) {
      handleComment(postId);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUwxMjUgMTI1TTEyNSA3NUw3NSAxMjUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+";
  };

  // Expandir/recolher comentários
  const toggleCommentsView = async (postId: string): Promise<void> => {
    if (showComments === postId) {
      setShowComments(null);
      return;
    }

    setShowComments(postId);
    
    // Carregar todos os comentários se ainda não foram carregados
    if (!fullComments[postId]) {
      await loadAllComments(postId);
    }
  };

  async function handleDelete(post: Post) {
    try {
      await API.delete(`/posts?id=${post.id}&userId=${session?.user.id}`);
      toast.success('Post excluído com sucesso');
      fetchPosts();
    } catch(error) {
      console.log(error);
      toast.error('Erro ao tentar excluir post', {
        action: {
          label: 'Tentar Novamente',
          onClick: () => {router.refresh()}
        }
      });
    }
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Carregando posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <div className="text-red-500">Erro: {error}</div>
        <Button onClick={() => fetchPosts()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="space-y-6 pb-6">
        {posts.map((post: Post) => {
          const allComments = fullComments[post.id] || post.comments;
          const isShowingAll = showComments === post.id;
          const displayComments = isShowingAll ? (allComments || []) : (post.comments || []).slice(0, 2);
          
          return (
            <Card key={post.id} className="overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => {
                  router.push(`user/${post.user.username}`)
                }}>
                  <Avatar className="h-10 w-10">
                    {post.user.avatar ? (
                      <AvatarImage src={post.user.avatar} />
                    ) : (
                      <AvatarFallback>{post.user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{post.user.username}</p>
                    {post.user.name && <p className="text-xs text-gray-500">{post.user.name}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => {router.push(`user/${post.user.username}`)}}>
                        <User/> Profile
                      </DropdownMenuItem>
                      {session?.user.id === post.user.id && (
                        <DropdownMenuItem onClick={() => handleDelete(post)}>
                          <Trash/> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Post Image */}
              <div className="aspect-square bg-gray-200 relative group">
                <img
                  src={post.mediaUrl}
                  alt="Post"
                  className="w-full h-full object-cover cursor-pointer"
                  onDoubleClick={() => toggleLike(post.id)}
                  onError={handleImageError}
                />
              </div>

              {/* Post Actions */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleLike(post.id)}>
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          likedPosts.has(post.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-700 hover:text-gray-500"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleCommentsView(post.id)}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Share className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSave(post.id)}>
                    <Bookmark
                      className={`h-5 w-5 transition-colors ${
                        savedPosts.has(post.id)
                          ? "fill-current text-gray-900"
                          : "text-gray-700 hover:text-gray-500"
                      }`}
                    />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-sm">
                    {post._count.likes} {post._count.likes === 1 ? 'curtida' : 'curtidas'}
                  </p>
                  <div className="text-sm">
                    <span className="font-semibold">{post.user.username}</span>{" "}
                    <span>{post.caption}</span>
                  </div>

                  {/* Comments Display */}
                  {post._count.comments > 0 && (
                    <div className="space-y-1">
                      {/* Link para ver todos os comentários */}
                      {post._count.comments > 2 && !isShowingAll && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => toggleCommentsView(post.id)}
                          disabled={loadingComments}
                        >
                          {loadingComments ? 'Carregando...' : `Ver todos os ${post._count.comments} comentários`}
                        </Button>
                      )}

                      {/* Lista de comentários */}
                      {displayComments.map((comment: Comment) => (
                        <div key={comment.id} className="flex items-start justify-between group">
                          <div className="flex items-start space-x-2 flex-1">
                            <Avatar className="h-6 w-6">
                              {comment.user.avatar ? (
                                <AvatarImage src={comment.user.avatar} />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {comment.user.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="text-sm flex-1">
                              <span className="font-semibold cursor-pointer" onClick={() => router.push(`user/${comment.user.username}`)}>
                                {comment.user.username}
                              </span>{" "}
                              <span>{comment.text}</span>
                              <div className="text-gray-500 text-xs mt-1">{formatTimeAgo(comment.createdAt)}</div>
                            </div>
                          </div>
                          
                          {/* Botão de deletar comentário (só aparece para o autor do comentário ou dono do post) */}
                          {(session?.user.id === comment.userId || session?.user.id === post.userId) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteComment(comment.id, post.id)}
                            >
                              <Trash className="h-3 w-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {/* Link para recolher comentários */}
                      {isShowingAll && post._count.comments > 2 && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => setShowComments(null)}
                        >
                          Ocultar comentários
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Add Comment Section */}
                  <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                    <Avatar className="h-8 w-8">
                      {session?.user?.avatar ? (
                        <AvatarImage src={session.user.avatar} />
                      ) : (
                        <AvatarFallback>
                          {session?.user?.name?.slice(0, 2).toUpperCase() || 'EU'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 flex items-center space-x-2">
                      <Input
                        placeholder="Adicione um comentário..."
                        value={newComment}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(e.target.value)}
                        className="border-0 bg-transparent focus:ring-0 text-sm"
                        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => handleKeyPress(e, post.id)}
                        disabled={submittingComment}
                        maxLength={500}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleComment(post.id)}
                        disabled={!newComment.trim() || submittingComment}
                      >
                        {submittingComment ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Load More Posts */}
        {hasMore && (
          <div className="flex justify-center py-6">
            <Button 
              variant="outline" 
              className="px-8 bg-transparent" 
              onClick={loadMorePosts}
              disabled={loading || loadingMore}
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais posts'}
            </Button>
          </div>
        )}

        {/* No more posts message */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 text-gray-500">
            Não há mais posts para carregar
          </div>
        )}

        {/* Empty state */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Nenhum post encontrado</div>
            <Button onClick={() => fetchPosts()}>Recarregar</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramFeed;