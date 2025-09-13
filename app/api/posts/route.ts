// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreatePostRequest, PostResponse, ApiResponse, MediaType } from '@/types/posts';
import { Post } from '@prisma/client';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PostResponse>>> {
  try {
    const body: CreatePostRequest = await request.json();
    
    const { caption, postType, mediaType, mediaUrl, userId } = body;

    // Validações
    if (!mediaUrl || !userId) {
      return NextResponse.json({
        success: false,
        error: 'URL da mídia e ID do usuário são obrigatórios'
      }, { status: 400 });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Criar post ou story
    if (postType === 'story') {
      // Criar story que expira em 24h
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await prisma.story.create({
        data: {
          caption,
          mediaUrl,
          mediaType,
          userId,
          expiresAt
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
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: story.id,
          caption: story.caption ?? undefined,
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType as MediaType,
          userId: story.userId,
          isActive: story.isActive,
          createdAt: story.createdAt.toISOString(),
          updatedAt: story.updatedAt.toISOString(),
          user: {
            name: story.user.name,
            id: story.user.id,
            avatar: story.user.avatar ?? undefined, // Adicione esta conversão
            username: story.user.username,
          },
          _count: {
            likes: 0,
            comments: 0
          }
        },
        message: 'Story criado com sucesso!'
      });

    } else {
      // Criar post normal
      const post = await prisma.post.create({
        data: {
          caption,
          mediaUrl,
          mediaType,
          userId
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          id: post.id,
          caption: post.caption ?? undefined,
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType as MediaType,
          userId: post.userId,
          isActive: post.isActive,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
          user: {
            name: post.user.name,
            id: post.user.id,
            avatar: post.user.avatar ?? undefined, // Adicione esta conversão
            username: post.user.username,
          },
          _count: post._count
        },
        message: 'Post criado com sucesso!'
      });
    }

  } catch (error) {
    console.error('Erro ao criar post:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PostResponse[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Construir filtros baseados nos parâmetros
    let where: any = { isActive: true };

    if (userId) {
      where.userId = userId;
    } else if (username) {
      where.user = {
        username: username
      };
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        comments: {
          take: 2,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const formattedPosts: PostResponse[] = posts.map(post => ({
      id: post.id,
      caption: post.caption ?? undefined, // Converte null para undefined
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType as MediaType,
      userId: post.userId,
      isActive: post.isActive,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      user: {
        id: post.user.id,
        username: post.user.username,
        name: post.user.name ?? undefined, // Também converta name se necessário
        avatar: post.user.avatar ?? undefined // Também converta avatar se necessário
      },
      _count: post._count,
      comments: post.comments?.map(comment => ({
        id: comment.id,
        content: comment.text || '',
        userId: comment.userId,
        createdAt: comment.createdAt.toISOString(),
        user: {
          id: comment.user.id,
          username: comment.user.username,
          name: comment.user.name ?? undefined,
          avatar: comment.user.avatar ?? undefined
        }
      }))
    }));

    return NextResponse.json({
      success: true,
      data: formattedPosts
    });

  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');
    const userId = searchParams.get('userId'); // quem está tentando deletar

    if (!postId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do post e ID do usuário são obrigatórios'
      }, { status: 400 });
    }

    // Verifica se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({
        success: false,
        error: 'Post não encontrado'
      }, { status: 404 });
    }

    // Garante que o post pertence ao usuário
    if (post.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Você não tem permissão para deletar este post'
      }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Post deletado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar post:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}