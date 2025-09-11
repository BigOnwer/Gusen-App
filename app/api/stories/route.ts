// app/api/stories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { StoryResponse, ApiResponse } from '@/types/posts';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StoryResponse[]>>> {
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user.id
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true }
    })

    const followingIds = following.map(f => f.followingId);

    // Filtrar stories ativos e não expirados
    const now = new Date();

    const stories = await prisma.story.findMany({
      where: {
        isActive: true,
      expiresAt: {
        gt: now // Maior que agora (não expirados)
      },
      userId: {in: [currentUserId || '', ...followingIds]}
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedStories = stories.map(story => ({
      id: story.id,
      caption: story.caption,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      userId: story.userId,
      isActive: story.isActive,
      expiresAt: story.expiresAt.toISOString(),
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
      user: story.user
    }));

    return NextResponse.json({
      success: true,
      data: formattedStories
    });

  } catch (error) {
    console.error('Erro ao buscar stories:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// Endpoint para limpar stories expirados
export async function DELETE(): Promise<NextResponse<ApiResponse<{ deletedCount: number }>>> {
  try {
    const now = new Date();
    
    const result = await prisma.story.updateMany({
      where: {
        expiresAt: {
          lt: now // Menor que agora (expirados)
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
      message: `${result.count} stories expirados foram desativados`
    });

  } catch (error) {
    console.error('Erro ao limpar stories:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}