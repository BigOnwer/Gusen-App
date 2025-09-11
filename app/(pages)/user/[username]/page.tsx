import { notFound } from 'next/navigation';
import { Metadata } from 'next';
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
async function getUserData(username: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        posts: true,
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

    // Converter datas para string para evitar problemas de serialização
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params; // ✅ Aguarda params
  
  try {
    const user = await getUserData(username);
    
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