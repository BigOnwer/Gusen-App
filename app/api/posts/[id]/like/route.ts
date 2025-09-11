// app/api/posts/[id]/like/route.ts - Versão melhorada

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface LikeRequest {
  userId: string;
  postId?: string; // Opcional, pois já vem da URL
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// POST - Curtir post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 POST /api/posts/[id]/like iniciado');
    
    // Aguardar params primeiro
    const { id: postId } = await params;
    console.log('🔍 Post ID da URL:', postId);
    
    // Parse do body
    const body: LikeRequest = await request.json();
    console.log('🔍 Body recebido:', body);
    
    const { userId } = body;

    // Validações melhoradas
    if (!userId) {
      console.error('❌ userId não fornecido');
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }

    if (!postId) {
      console.error('❌ postId não fornecido');
      return NextResponse.json({
        success: false,
        error: 'ID do post é obrigatório'
      }, { status: 400 });
    }

    console.log(`🔍 Processando like: userId=${userId}, postId=${postId}`);

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error('❌ Usuário não encontrado:', userId);
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId, isActive: true }
    });

    if (!post) {
      console.error('❌ Post não encontrado:', postId);
      return NextResponse.json({
        success: false,
        error: 'Post não encontrado'
      }, { status: 404 });
    }

    // Verificar se já existe like
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (existingLike) {
      console.warn('⚠️ Like já existe');
      return NextResponse.json({
        success: false,
        error: 'Post já foi curtido por este usuário'
      }, { status: 409 }); // 409 Conflict é mais apropriado que 400
    }

    // Criar like usando transação
    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Criando like...');
      
      await tx.like.create({
        data: {
          userId,
          postId
        }
      });

      const likesCount = await tx.like.count({
        where: { postId }
      });

      console.log('✅ Like criado, nova contagem:', likesCount);
      return { likesCount };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Post curtido com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao curtir post:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// DELETE - Descurtir post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ likesCount: number }>>> {
  try {
    console.log('📝 DELETE /api/posts/[id]/like iniciado');
    
    // Aguardar params primeiro
    const { id: postId } = await params;
    console.log('🔍 Post ID da URL:', postId);
    
    // Parse do body
    const body: LikeRequest = await request.json();
    console.log('🔍 Body recebido:', body);
    
    const { userId } = body;

    // Validações
    if (!userId) {
      console.error('❌ userId não fornecido');
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }

    if (!postId) {
      console.error('❌ postId não fornecido');
      return NextResponse.json({
        success: false,
        error: 'ID do post é obrigatório'
      }, { status: 400 });
    }

    console.log(`🔍 Removendo like: userId=${userId}, postId=${postId}`);

    // Verificar se o like existe
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (!existingLike) {
      console.warn('⚠️ Like não encontrado');
      return NextResponse.json({
        success: false,
        error: 'Like não encontrado'
      }, { status: 404 });
    }

    // Remover like usando transação
    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Removendo like...');
      
      await tx.like.delete({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      });

      const likesCount = await tx.like.count({
        where: { postId }
      });

      console.log('✅ Like removido, nova contagem:', likesCount);
      return { likesCount };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Like removido com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao remover like:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}

// Adicionar também uma rota GET para verificar o status do like
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 });
    }

    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    const likesCount = await prisma.like.count({
      where: { postId }
    });

    return NextResponse.json({
      success: true,
      data: {
        isLiked: !!like,
        likesCount
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar like:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}