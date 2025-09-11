import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import CreateStoryModal from './CreateStoryModal';

// Tipos TypeScript
interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
}

interface Story {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  user: User;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface GroupedStories {
  userId: string;
  user: User;
  stories: Story[];
  hasUnwatched: boolean;
}

// Props do componente
interface InstagramStoriesProps {
  currentUserId?: string;
  apiBaseUrl?: string;
  onCreateStory?: () => void;
}

// Função para verificar se story expirou
const isStoryExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date();
};

// Função para formatar tempo restante
const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffInMs = expires.getTime() - now.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHours <= 0) return 'Expirado';
  if (diffInHours < 24) return `${diffInHours}h restantes`;
  return 'Ativo';
};

const InstagramStories: React.FC<InstagramStoriesProps> = ({ 
  currentUserId,
  apiBaseUrl = '/api',
  onCreateStory
}) => {
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
  const [watchedStories, setWatchedStories] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: session } = useSession();

  // Buscar stories da API
  const fetchStories = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${apiBaseUrl}/stories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Story[]> = await response.json();

      if (result.success && result.data) {
        // Filtrar stories não expirados
        const activeStories = result.data.filter(story => 
          story.isActive && !isStoryExpired(story.expiresAt)
        );

        // Agrupar stories por usuário
        const grouped = activeStories.reduce((acc: Record<string, GroupedStories>, story) => {
          if (!acc[story.userId]) {
            acc[story.userId] = {
              userId: story.userId,
              user: story.user,
              stories: [],
              hasUnwatched: false
            };
          }
          acc[story.userId].stories.push(story);
          return acc;
        }, {});

        // Converter para array e ordenar (usuário atual primeiro)
        const groupedArray = Object.values(grouped).map(group => ({
          ...group,
          hasUnwatched: group.stories.some(story => !watchedStories.has(story.id)),
          stories: group.stories.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        }));

        // Ordenar: usuário atual primeiro, depois por data mais recente
        groupedArray.sort((a, b) => {
          if (a.userId === currentUserId) return -1;
          if (b.userId === currentUserId) return 1;
          
          const aLatest = Math.max(...a.stories.map(s => new Date(s.createdAt).getTime()));
          const bLatest = Math.max(...b.stories.map(s => new Date(s.createdAt).getTime()));
          
          return bLatest - aLatest;
        });

        setGroupedStories(groupedArray);
        setError(null);
      } else {
        setError(result.error || 'Erro ao carregar stories');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão com a API';
      setError(errorMessage);
      console.error('Erro ao buscar stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [currentUserId]);

  // Abrir visualizador de story
  const openStoryViewer = (group: GroupedStories, startIndex: number = 0): void => {
    if (group.stories.length > 0) {
      setSelectedStory(group.stories[startIndex]);
      setCurrentStoryIndex(startIndex);
      
      // Marcar como assistido
      setWatchedStories(prev => new Set([...prev, group.stories[startIndex].id]));
    }
  };

  // Navegar entre stories
  const navigateStory = (direction: 'next' | 'prev'): void => {
    if (!selectedStory) return;

    const currentGroup = groupedStories.find(g => 
      g.stories.some(s => s.id === selectedStory.id)
    );
    
    if (!currentGroup) return;

    let newIndex = currentStoryIndex;
    
    if (direction === 'next') {
      newIndex = currentStoryIndex + 1;
      if (newIndex >= currentGroup.stories.length) {
        // Ir para próximo usuário
        const currentGroupIndex = groupedStories.findIndex(g => g.userId === currentGroup.userId);
        const nextGroupIndex = currentGroupIndex + 1;
        
        if (nextGroupIndex < groupedStories.length) {
          const nextGroup = groupedStories[nextGroupIndex];
          setSelectedStory(nextGroup.stories[0]);
          setCurrentStoryIndex(0);
          setWatchedStories(prev => new Set([...prev, nextGroup.stories[0].id]));
        } else {
          setSelectedStory(null);
        }
        return;
      }
    } else {
      newIndex = currentStoryIndex - 1;
      if (newIndex < 0) {
        // Ir para usuário anterior
        const currentGroupIndex = groupedStories.findIndex(g => g.userId === currentGroup.userId);
        const prevGroupIndex = currentGroupIndex - 1;
        
        if (prevGroupIndex >= 0) {
          const prevGroup = groupedStories[prevGroupIndex];
          const lastStoryIndex = prevGroup.stories.length - 1;
          setSelectedStory(prevGroup.stories[lastStoryIndex]);
          setCurrentStoryIndex(lastStoryIndex);
          setWatchedStories(prev => new Set([...prev, prevGroup.stories[lastStoryIndex].id]));
        }
        return;
      }
    }

    setSelectedStory(currentGroup.stories[newIndex]);
    setCurrentStoryIndex(newIndex);
    setWatchedStories(prev => new Set([...prev, currentGroup.stories[newIndex].id]));
  };

  // Fechar visualizador
  const closeStoryViewer = (): void => {
    setSelectedStory(null);
    setCurrentStoryIndex(0);
  };

  // Verificar se usuário atual tem stories
  const currentUserGroup = groupedStories.find(g => g.userId === currentUserId);
  const hasCurrentUserStories = currentUserGroup && currentUserGroup.stories.length > 0;

  console.log('avatar: ' + session?.user.avatar)

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex flex-col items-center space-y-2 min-w-[80px]">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-sm">{error}</div>
        <Button variant="ghost" size="sm" onClick={fetchStories} className="mt-2">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const handleStoryCreated = () => {
    console.log('Story criado com sucesso!');
    fetchStories();
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  // Fechar modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Stories Carousel */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-4 p-4 overflow-x-auto scrollbar-hide">
            
          {/* Seu Story (sempre primeiro) */}
          <div className="flex flex-col items-center space-y-2 min-w-[80px]">
            <div className="relative">
              {hasCurrentUserStories ? (
                <button
                  onClick={() => openStoryViewer(currentUserGroup!, 0)}
                  className="relative"
                >
                  <div className={`w-16 h-16 rounded-full p-[2px] ${
                    currentUserGroup!.hasUnwatched ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <Avatar className="w-full h-full border-2 border-white">
                      {session?.user.avatar ? (
                        <AvatarImage src={session?.user.avatar} />
                      ) : (
                        <AvatarFallback>EU</AvatarFallback>
                      )}
                      
                    </Avatar>
                    
                  </div>
                </button>
              ) : (
                <div className={`w-16 h-16 rounded-full p-[2px] bg-black`}>
                    <Avatar className="w-full h-full border-2 border-white">
                      {session?.user?.avatar ? (
                        <AvatarImage src={session.user.avatar || ''} />
                      ) : (
                        <AvatarFallback>EU</AvatarFallback>
                      )}
                      
                    </Avatar>
                    
                </div>
              )}
            </div>
            <p className="text-xs text-center font-medium">
              {hasCurrentUserStories ? 'Seu story' : 'Seu story'}
            </p>
          </div>

            <CreateStoryModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onStoryCreated={handleStoryCreated}
                userId={session?.user.id}
                apiBaseUrl={apiBaseUrl}
            />

          {/* Stories de outros usuários */}
          {groupedStories
            .filter(group => group.userId !== currentUserId)
            .map((group) => (
              <div key={group.userId} className="flex flex-col items-center space-y-2 min-w-[80px]">
                <button
                  onClick={() => openStoryViewer(group, 0)}
                  className="relative"
                >
                  <div className={`w-16 h-16 rounded-full p-[2px] ${
                    group.hasUnwatched 
                      ? 'bg-secundary' 
                      : 'bg-gray-300'
                  }`}>
                    <Avatar className="w-full h-full border-2 border-white">
                      {group.user.avatar ? (
                        <AvatarImage src={group.user.avatar} />
                      ) : (
                        <AvatarFallback>
                          {group.user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>
                  {/* Indicador de múltiplos stories */}
                  {group.stories.length > 1 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {group.stories.length}
                    </div>
                  )}
                </button>
                <p className="text-xs text-center max-w-[80px] truncate">
                  {group.user.username}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black" onClick={closeStoryViewer}></div>
          
          {/* Story content */}
          <div className="relative w-96 max-w-md h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4">
              {/* Progress bars */}
              <div className="flex space-x-1 mb-4">
                {groupedStories
                  .find(g => g.stories.some(s => s.id === selectedStory.id))
                  ?.stories.map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1 rounded-full ${
                        index < currentStoryIndex
                          ? 'bg-white'
                          : index === currentStoryIndex
                          ? 'bg-white bg-opacity-70'
                          : 'bg-white bg-opacity-30'
                      }`}
                    />
                  ))}
              </div>
              
              {/* User info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    {selectedStory.user.avatar ? (
                      <AvatarImage src={selectedStory.user.avatar} />
                    ) : (
                      <AvatarFallback className="text-black">
                        {selectedStory.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {selectedStory.user.username}
                    </p>
                    <p className="text-white text-opacity-70 text-xs">
                      {formatTimeRemaining(selectedStory.expiresAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeStoryViewer}
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Story media */}
            <div className="flex-1 flex items-center justify-center relative">
              {selectedStory.mediaType.startsWith('image/') ? (
                <video
                  src={selectedStory.mediaUrl}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <Image
                width={1000}
                height={1000}
                  src={selectedStory.mediaUrl}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {/* Navigation areas */}
              <button
                className="absolute left-0 top-0 w-1/3 h-full z-10"
                onClick={() => navigateStory('prev')}
              />
              <button
                className="absolute right-0 top-0 w-1/3 h-full z-10"
                onClick={() => navigateStory('next')}
              />
            </div>

            {/* Caption */}
            {selectedStory.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <p className="text-white text-sm">{selectedStory.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default InstagramStories;