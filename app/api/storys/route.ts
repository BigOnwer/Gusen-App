import { prisma } from "@/lib/prisma";
import { ApiResponse, StoryResponse } from "@/types/posts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StoryResponse[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Filtros para stories ativos e não expirados
    const where = {
      isActive: true,
      expiresAt: {
        gt: new Date() // Apenas stories que não expiraram
      },
      ...(userId && { userId })
    };

    const stories = await prisma.story.findMany({
      where,
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

    const formattedStories: StoryResponse[] = stories.map(story => ({
      id: story.id,
      caption: story.caption,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      userId: story.userId,
      isActive: story.isActive,
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
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

// Marcar story como assistido
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const { storyId, userId } = body;

    if (!storyId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do story e do usuário são obrigatórios'
      }, { status: 400 });
    }

    // Aqui você pode implementar a lógica para marcar story como assistido
    // Por exemplo, criar uma tabela de visualizações de stories
    
    // await prisma.storyView.create({
    //   data: {
    //     storyId,
    //     userId
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Story marcado como assistido'
    });

  } catch (error) {
    console.error('Erro ao marcar story como assistido:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}