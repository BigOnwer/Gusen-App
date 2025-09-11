import { useTransition } from "react";
import { Button } from "./ui/button";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowButtonProps {
  userId: string;
  targetUserId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ 
  userId, 
  targetUserId, 
  isFollowing,
  onFollowChange 
}: FollowButtonProps) {
  const [isPending, startTransition] = useTransition();
  const route = useRouter()

  const handleFollowToggle = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            targetUserId,
            action: isFollowing ? 'unfollow' : 'follow'
          }),
        });

        if (!response.ok) throw new Error('Erro ao atualizar seguimento');

        const newFollowingState = !isFollowing;
        onFollowChange?.(newFollowingState); // sincroniza com hook
      } catch (error) {
        console.error('Erro:', error);
      }
    });
    route.refresh()
  };

  if (userId === targetUserId) return null;

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isPending}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={`transition-all duration-200 ${
        isFollowing 
          ? "hover:bg-destructive hover:text-destructive-foreground" 
          : "hover:bg-primary/90"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isPending ? "Carregando..." : isFollowing ? "Parar de seguir" : "Seguir"}
    </Button>
  );
}
