import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Smile, Send } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
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
  _count: {
    likes: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  text: string;
  username: string;
  timeAgo: string;
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
interface PostSectionProps {
  apiBaseUrl?: string;
}

const PostSection: React.FC<PostSectionProps> = ({ 
  apiBaseUrl = '/api'
}) => {
  const router = useRouter();
  const { username } = router.query;
  
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
  const [targetUser, setTargetUser] = useState<User | null>(null);

  // Simular comentários locais (na aplicação real, viriam da API)
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>({});

  const { data: session, status } = useSession();

  // Buscar informações do usuário alvo
  const fetchUserByUsername = async (usernameParam: string): Promise<User | null> => {
    try {
      const url = `${apiBaseUrl}/users/username/${usernameParam}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Usuário não encontrado');
        }
        throw new Error(`Erro ao buscar usuário: ${response.status}`);
      }
      
      const result: ApiResponse<User> = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Erro ao buscar dados do usuário');
      }
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      throw err;
    }
  };

  // Buscar posts da API filtrados por usuário
  const fetchPosts = async (page: number = 1, append: boolean = false): Promise<void> => {
    if (!targetUser) {
      console.log('Aguardando dados do usuário...');
      return;
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const url = new URL(`${apiBaseUrl}/posts`, window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '10');
      url.searchParams.append('userId', targetUser.id); // Filtrar por ID do usuário alvo

      console.log(`Buscando posts do usuário ${targetUser.username} (ID: ${targetUser.id})`);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Post[]> = await response.json();

      if (result.success && result.data) {
        const newPosts = result.data;
        
        // Filtro adicional no frontend para garantir que só posts do usuário alvo apareçam
        const filteredPosts = newPosts.filter(post => post.userId === targetUser.id);
        
        if (append) {
          setPosts(prev => [...prev, ...filteredPosts]);
        } else {
          setPosts(filteredPosts);
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

  // Effect principal - carrega usuário quando username muda
  useEffect(() => {
    const loadUserAndPosts = async () => {
      if (!username || typeof username !== 'string') {
        setError('Username não fornecido na URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setPosts([]);
        setCurrentPage(1);
        setHasMore(true);

        console.log(`Carregando perfil do usuário: ${username}`);
        
        const user = await fetchUserByUsername(username);
        setTargetUser(user);

        // Os posts serão carregados pelo próximo useEffect
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadUserAndPosts();
  }, [username, apiBaseUrl]);

  // Effect para carregar posts quando targetUser é definido
  useEffect(() => {
    if (targetUser) {
      fetchPosts();
      if (session?.user?.id) {
        loadUserLikes();
      }
    }
  }, [targetUser, session?.user?.id]);

  // Carregar likes existentes do usuário logado
  const loadUserLikes = async (): Promise<void> => {
    if (!session?.user?.id) {
      console.warn('⚠️ Usuário não logado, não carregando likes');
      return;
    }

    try {
      const url = `${apiBaseUrl}/users/${session.user.id}/likes`;
      console.log('🔍 Carregando likes do usuário:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('🔍 Status da resposta:', response.status);
      
      if (response.ok) {
        const result: ApiResponse<{postIds: string[]}> = await response.json();
        console.log('✅ Likes carregados:', result);
        
        if (result.success && result.data) {
          setLikedPosts(new Set(result.data.postIds));
          console.log('✅ Likes aplicados ao estado:', result.data.postIds);
        }
      } else {
        console.warn('⚠️ Não foi possível carregar likes do usuário:', response.status);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar likes do usuário:', err);
    }
  };

  // Funcionalidades de interação
  const toggleLike = async (postId: string): Promise<void> => {
    const isCurrentlyLiked = likedPosts.has(postId);
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      setError('Você precisa estar logado para curtir posts');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const url = `${apiBaseUrl}/posts/${postId}/like`;
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      console.log('🔍 URL chamada:', url);
      console.log('🔍 Método:', method);
      console.log('🔍 Post ID:', postId);
      console.log('🔍 User ID:', currentUserId);
      console.log('🔍 Está curtido?', isCurrentlyLiked);

      // Chamar API PRIMEIRO, antes de atualizar o estado
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

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 Erro da API:', errorText);
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      const result: ApiResponse<any> = await response.json();
      console.log('✅ Resultado da API:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar like');
      }

      // SOMENTE após sucesso na API, atualizar o estado local
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (isCurrentlyLiked) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });

      // Atualizar contagem de likes usando o valor retornado pela API
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
      setError(`Erro ao curtir post: ${errorMessage}`);
      setTimeout(() => setError(null), 5000);
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

    // Aqui você poderia fazer a chamada para a API de saves
    // fetch(`${apiBaseUrl}/posts/${postId}/save`, { method: 'POST' });
  };

  const handleComment = async (postId: string): Promise<void> => {
    if (!newComment.trim() || !session?.user?.id) return;

    try {
      const comment: Comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        username: session.user.username || 'usuario', // Usar dados do usuário logado
        timeAgo: 'agora'
      };

      // Atualizar estado local
      setLocalComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment]
      }));

      setNewComment('');

      // Aqui você poderia fazer a chamada para a API de comentários
      // const commentData: CreateCommentRequest = {
      //   text: newComment.trim(),
      //   postId,
      //   userId: session.user.id
      // };
      // await fetch(`${apiBaseUrl}/comments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(commentData)
      // });

    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
    }
  };

  const loadMorePosts = (): void => {
    if (!loading && !loadingMore && hasMore && targetUser) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(nextPage, true);
    }
  };

  // Combinar comentários da API com comentários locais
  const getPostComments = (postId: string): Comment[] => {
    return localComments[postId] || [];
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, postId: string): void => {
    if (e.key === "Enter") {
      handleComment(postId);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUwxMjUgMTI1TTEyNSA3NUw3NSAxMjUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+";
  };

  // Estados de loading e erro
  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">
          {targetUser ? `Carregando posts de @${targetUser.username}...` : 'Carregando usuário...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <div className="text-red-500">Erro: {error}</div>
        <Button onClick={() => {
          setError(null);
          if (username && typeof username === 'string') {
            fetchUserByUsername(username)
              .then(setTargetUser)
              .catch(err => setError(err.message));
          }
        }}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen">
      {/* Header com informações do usuário */}
      {targetUser && (
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 mb-6 z-10">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {targetUser.avatar ? (
                <AvatarImage src={targetUser.avatar} />
              ) : (
                <AvatarFallback>{targetUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="font-bold text-lg">@{targetUser.username}</h1>
              {targetUser.name && <p className="text-gray-600">{targetUser.name}</p>}
              <p className="text-sm text-gray-500">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 pb-6">
        {posts.map((post: Post) => {
          const postComments: Comment[] = getPostComments(post.id);
          
          return (
            <Card key={post.id} className="overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
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
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
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
                      onClick={() => setShowComments(showComments === post.id ? null : post.id)}
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

                  {(post._count.comments > 0 || postComments.length > 0) && (
                    <div className="space-y-1">
                      {(post._count.comments + postComments.length) > 0 && (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                        >
                          Ver todos os {post._count.comments + postComments.length} comentários
                        </Button>
                      )}

                      {/* Mostrar últimos 2 comentários locais */}
                      {postComments.slice(-2).map((comment: Comment) => (
                        <div key={comment.id} className="text-sm">
                          <span className="font-semibold">{comment.username}</span> <span>{comment.text}</span>
                          <span className="text-gray-500 ml-2">{comment.timeAgo}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comments Section */}
                  {showComments === post.id && (
                    <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {postComments.map((comment: Comment) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {comment.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-sm">
                              <span className="font-semibold">{comment.username}</span>{" "}
                              <span>{comment.text}</span>
                              <div className="text-gray-500 text-xs mt-1">{comment.timeAgo}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Comment */}
                      {session?.user && (
                        <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                          <Avatar className="h-8 w-8">
                            {session.user.image ? (
                              <AvatarImage src={session.user.image} />
                            ) : (
                              <AvatarFallback>
                                {session.user.username?.slice(0, 2).toUpperCase() || 'EU'}
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
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Smile className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleComment(post.id)}
                              disabled={!newComment.trim()}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Load More Posts */}
        {hasMore && (
          <div className="flex justify-center">
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
          <div className="text-center text-gray-500">
            Não há mais posts para carregar
          </div>
        )}

        {/* Empty state */}
        {posts.length === 0 && !loading && targetUser && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              @{targetUser.username} ainda não publicou nenhum post
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostSection;