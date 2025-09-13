'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Edit, UserPlus, Save, X, FileText, Heart, MessageCircle, Bookmark, MoreHorizontal, Share, Smile, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, EditFormData } from '@/types/user';
import { useSession } from 'next-auth/react';
import { useFollowStatus } from '@/hooks/useFollowStatus';
import FollowButton from './FollowButton';

interface UserProfileProps {
  user: User;
  userId?: string;
  apiBaseUrl?: string;
}

interface ApiError {
  error: string;
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

export default function UserProfile({userId, apiBaseUrl, user}: UserProfileProps,) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>('');
  const [editForm, setEditForm] = useState<EditFormData>({
    name: user.name || '',
    bio: user.bio || '',
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>({});

  const { data: session, status } = useSession()

  const { isFollowing, setIsFollowing } = useFollowStatus(session?.user.id || '', userId || '');
  

  const handleEdit = (): void => {
    setIsEditing(true);
    setError('');
  };

  const handleSave = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/user/${user.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        const errorData: ApiError = await response.json();
        setError(errorData.error || 'Erro ao salvar alterações');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setEditForm({
      name: user.name || '',
      bio: user.bio || '',
    });
    setIsEditing(false);
    setError('');
  };

  async function fetchPosts(page: number = 1, append: boolean = false) {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const url = new URL(`/api/posts?username=${user.username}`, window.location.origin);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', '10');

        const response = await fetch(url.toString());

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
  }

  useEffect(() => {
      fetchPosts();
      loadUserLikes(); // Carregar likes existentes do usuário
    }, [userId]);
  
    // Carregar likes existentes do usuário
    // Função loadUserLikes corrigida - substitua no seu Feed.tsx
  
      const loadUserLikes = async (): Promise<void> => {
          if (!userId) {
              console.warn('⚠️ Usuário não logado, não carregando likes');
              return;
          }
  
          try {
              const url = `api/users/${userId}/likes`;
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
    // Função toggleLike corrigida - substitua no seu Feed.tsx
  
      // Função toggleLike corrigida
  const toggleLike = async (postId: string): Promise<void> => {
    const isCurrentlyLiked = likedPosts.has(postId);
    const currentUserId = session?.user?.id;

    // Verificar se o usuário está logado
    if (!currentUserId) {
      setError('Você precisa estar logado para curtir posts');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      // Atualizar estado local imediatamente (UI otimista)
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (isCurrentlyLiked) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });

      // Atualizar contagem de likes localmente
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              _count: {
                ...post._count,
                likes: post._count.likes + (isCurrentlyLiked ? -1 : 1)
              }
            }
          : post
      ));

      // Construir URL correta - usar URL relativa para Next.js
      const url = `/api/posts/${postId}/like`;
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      console.log('Chamando API:', { url, method, postId, userId: currentUserId });

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: currentUserId,
          postId: postId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar like');
      }

      // Sincronizar com resposta da API se necessário
      if (result.data?.likesCount !== undefined) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? {
                ...post,
                _count: {
                  ...post._count,
                  likes: result.data.likesCount
                }
              }
            : post
        ));
      }

      console.log('Like processado com sucesso');

    } catch (err) {
      console.error('Erro ao curtir post:', err);
      
      // Reverter estado local em caso de erro
      setLikedPosts(prev => {
        const newLiked = new Set(prev);
        if (!isCurrentlyLiked) {
          newLiked.delete(postId);
        } else {
          newLiked.add(postId);
        }
        return newLiked;
      });

      // Reverter contagem de likes
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              _count: {
                ...post._count,
                likes: post._count.likes + (isCurrentlyLiked ? 1 : -1)
              }
            }
          : post
      ));

      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao curtir post: ${errorMessage}`);
      setTimeout(() => setError(null), 5000);
    }
  };
  
  
    const loadMorePosts = (): void => {
      if (!loading && !loadingMore && hasMore) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchPosts(nextPage, true);
      }
    };
  
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
      e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik03NSA3NUwxMjUgMTI1TTEyNSA3NUw3NSAxMjUiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+";
    };
  
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

  const handleInputChange = (
    field: keyof EditFormData,
    value: string
  ): void => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    });
  };

  const bioCharCount = editForm.bio.length;
  const bioMaxLength = 160;

  console.log(isFollowing)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => {
            if(status === 'authenticated') {
              router.push('/dashboard') 
              console.log('autenticado')
            }
              else if(status === 'unauthenticated') {
                router.push('/')
                console.log('se autentic')
              }
          }}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-primary to-primary/60" />
          
          <CardContent className="relative pt-0 pb-6">
            {/* Avatar */}
            <div className="flex justify-center -mt-16 mb-6">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="text-4xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* User Info */}
            <div className="text-center space-y-4">
              {!isEditing ? (
                <>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{user.name}</h1>
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.bio && (
                      <p className="max-w-md mx-auto text-foreground">{user.bio}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Entrou em {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="max-w-md mx-auto space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="avatar">Foto de Perfil</Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      disabled={loading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("userId", user.id);

                          fetch("/api/user/upload", {
                            method: "POST",
                            body: formData,
                          })
                            .then((res) => res.json())
                            .then((result) => {
                              if (result.success) {
                                router.refresh();
                              } else {
                                setError(result.error || "Erro ao enviar imagem");
                              }
                            })
                            .catch(() => setError("Erro ao enviar imagem"));
                        }
                      }}
                    />
                  </div>

                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => 
                        handleInputChange('name', e.target.value)
                      }
                      disabled={loading}
                      placeholder="Seu nome"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm.bio}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                        handleInputChange('bio', e.target.value)
                      }
                      disabled={loading}
                      placeholder="Conte um pouco sobre você..."
                      maxLength={bioMaxLength}
                      rows={3}
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {bioCharCount}/{bioMaxLength} caracteres
                      </span>
                      {bioCharCount > bioMaxLength * 0.9 && (
                        <span className={bioCharCount === bioMaxLength ? "text-destructive" : "text-warning"}>
                          {bioMaxLength - bioCharCount} restantes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 my-8">
              <div className="text-center">
                <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                  {user._count?.following}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Seguidores</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                  {user._count?.followers}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Seguindo</p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                  {user._count?.posts}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Posts</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {!isEditing ? (
                <>
                {session?.user.username === user.username ? (
                  <Button onClick={handleEdit} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Editar Perfil
                  </Button>
                ): (
                  <></>
                )}
                  {session?.user?.id && session.user.id !== userId && (
                    <FollowButton
                      userId={session.user.id || ''}
                      targetUserId={userId || ''}
                      isFollowing={isFollowing || false}
                      onFollowChange={setIsFollowing}
                    />
                  )}
                </>
              ) : (
                <>
                  <Button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Posts Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-xl font-bold">Posts</h2>
            </div>
            <Separator />
          </CardHeader>
          <CardContent>
            <div className="">
              <div className="">
                {posts.map((post: Post) => {
                  const totalLikes: number = post._count.likes + (likedPosts.has(post.id) ? 1 : 0);
                  
                  return (
                    <Card key={post.id} className="overflow-hidden w-80 h-80">
                      {/* Post Header */}
                      <div className="flex items-center justify-between px-4">
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
                        </div>
                      </div>

                      {/* Post Image */}
                      <div className="aspect-square bg-gray-200 flex justify-center">
                        <img
                          src={post.mediaUrl}
                          alt="Post"
                          className="w-60 h-60 object-cover cursor-pointer"
                          onDoubleClick={() => toggleLike(post.id)}
                          onError={handleImageError}
                        />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}