import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // ajuste o caminho conforme sua configuração
import { prisma } from '@/lib/prisma';
import UserProfile from '@/components/UserProfile';
import { User } from '@/types/user';

interface UserPageProps {
  params: Promise<{ username: string }>; // Note que params agora é uma Promise
}

// Gerar metadata dinâmica
export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const { username } = await params; // ✅ Aguarda params primeiro

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        name: true,
        bio: true,
        avatar: true,
      },
    });

    return {
      title: user ? `${user.name} (@${username})` : 'Usuário não encontrado',
      description: user?.bio || `Perfil de ${username}`,
    };
  } catch (error) {
    return {
      title: 'Erro',
      description: 'Erro ao carregar perfil',
    };
  }
}

// Buscar dados do usuário no servidor
async function getUserData(username: string, currentUserId?: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isOnline: true,
        lastSeen: true,
        followers: {
          select: {
            followerId: true,
            follower: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
        isVerified: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            caption: true,
            mediaUrl: true,
            mediaType: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              }
            }
          }
        },
        following: {
          select: {
            followingId: true,
            following: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    });

    if (!user) {
      return null;
    }

    // Verificar se o usuário atual está seguindo este perfil
    const isFollowing = currentUserId 
      ? user.followers.some(follower => follower.followerId === currentUserId)
      : false;

    // Converter datas para string para evitar problemas de serialização
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastSeen: user.lastSeen,
      isFollowing, // ✅ Adicionar a propriedade isFollowing
      posts: user.posts.map(post => ({
        ...post,
        createdAt: post.createdAt.toISOString()
      }))
    };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params; // ✅ Aguarda params
  
  try {
    // Buscar sessão atual para verificar se está seguindo
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    
    const user = await getUserData(username, currentUserId);
    
    if (!user) {
      notFound();
    }

    return (
      <UserProfile
        user={user} 
        userId={user.id}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL || ''} 
      />
    );
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    throw new Error('Erro ao carregar perfil do usuário');
  }
}