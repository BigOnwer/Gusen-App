// app/api/users/[id]/likes/route.ts - Nova API route

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// GET - Buscar todos os likes de um usuário
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
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

    // Buscar todos os likes do usuário
    const likes = await prisma.like.findMany({
      where: { userId },
      select: {
        postId: true
      }
    });

    const postIds = likes.map(like => like.postId);

    return NextResponse.json({
      success: true,
      data: {
        postIds,
        total: postIds.length
      },
      message: `${postIds.length} likes encontrados`
    });

  } catch (error) {
    console.error('❌ Erro ao buscar likes do usuário:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}