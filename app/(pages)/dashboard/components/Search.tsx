
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@/types/user"
import FollowButton from "@/components/FollowButton"
import { useFollowStatus } from "@/hooks/useFollowStatus"

// Componente para cada item de usuário pesquisado
const SearchUserItem = ({ user, currentUserId, onNavigate }: { 
  user: User; 
  currentUserId: string; 
  onNavigate: (username: string) => void;
}) => {
  const { isFollowing, setIsFollowing } = useFollowStatus(currentUserId, user.id || '');

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer">
      <div
        className="flex items-center space-x-3"
        onClick={() => onNavigate(user.username)}
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-1">
            <p className="font-semibold text-sm">{user.username}</p>
            {user.isVerified && (
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {user.followers?.length || 0} seguidores
          </p>
        </div>
      </div>
      <FollowButton
        userId={currentUserId}
        targetUserId={user.id || ''} 
        isFollowing={isFollowing || false}
        onFollowChange={setIsFollowing}
      />
    </div>
  );
};

export default SearchUserItem