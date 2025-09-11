// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
// import { authOptions } from '../auth/[...nextauth]/route'; // Ajuste para seu caminho de auth

const prisma = new PrismaClient();

// GET - Buscar comentários de um post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post não encontrado' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId },
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    // Contar total de comentários
    const totalComments = await prisma.comment.count({
      where: { postId }
    });

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total: totalComments,
          hasMore: skip + comments.length < totalComments
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo comentário
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { success: false, error: 'Usuário não autenticado' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const { text, postId, userId } = body;

    // Validações básicas
    if (!text || !postId || !userId) {
      return NextResponse.json(
        { success: false, error: 'text, postId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comentário não pode estar vazio' },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comentário muito longo (máximo 500 caracteres)' },
        { status: 400 }
      );
    }

    // Verificar se o post existe
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Criar o comentário
    const comment = await prisma.comment.create({
      data: {
        text: text.trim(),
        userId,
        postId
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

    // Contar total de comentários do post
    const totalComments = await prisma.comment.count({
      where: { postId }
    });

    return NextResponse.json({
      success: true,
      data: {
        comment,
        totalComments
      },
      message: 'Comentário criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar comentário
export async function DELETE(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { success: false, error: 'Usuário não autenticado' },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');

    if (!commentId || !userId) {
      return NextResponse.json(
        { success: false, error: 'commentId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o comentário
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comentário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário pode deletar (autor do comentário ou dono do post)
    if (comment.userId !== userId && comment.post.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar este comentário' },
        { status: 403 }
      );
    }

    // Deletar o comentário
    await prisma.comment.delete({
      where: { id: commentId }
    });

    // Contar comentários restantes do post
    const totalComments = await prisma.comment.count({
      where: { postId: comment.postId }
    });

    return NextResponse.json({
      success: true,
      data: { totalComments },
      message: 'Comentário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar comentário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}