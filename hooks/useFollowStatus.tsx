//Hook do botao de follow

import React, { useState } from "react";

export function useFollowStatus(userId: string, targetUserId: string) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/follow/status?userId=${userId}&targetUserId=${targetUserId}`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
          console.log(isFollowing)
        }
      } catch (error) {
        console.error('Erro ao verificar status de seguimento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && targetUserId) {
      checkFollowStatus();
    }
  }, [userId, targetUserId]);

  return { isFollowing, isLoading, setIsFollowing };
}