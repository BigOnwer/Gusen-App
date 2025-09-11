// hooks/use-follow.ts

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseFollowProps {
  userId: string;
  initialIsFollowing?: boolean;
}

export function useFollow({ userId, initialIsFollowing = false }: UseFollowProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/follow`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    checkFollowStatus();
  }, [userId]);

  const toggleFollow = async () => {
    setIsLoading(true);
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        router.refresh(); // Atualiza os dados da página
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar');
      }
    } catch (error) {
      console.error('Erro ao toggle follow:', error);
      // Aqui você pode adicionar um toast de erro
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFollowing,
    isLoading,
    toggleFollow,
  };
}