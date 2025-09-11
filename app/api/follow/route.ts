// app/api/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ajuste o caminho conforme sua estrutura

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetUserId, action } = body;

    if (!userId || !targetUserId || !action) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes' },
        { status: 400 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Usuário não pode seguir a si mesmo' },
        { status: 400 }
      );
    }

    if (action === 'follow') {
      // Criar relacionamento de seguimento
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
        update: {},
        create: {
          followerId: userId,
          followingId: targetUserId,
        },
      });

      return NextResponse.json({ 
        success: true, 
        isFollowing: true,
        message: 'Usuário seguido com sucesso' 
      });
    } 
    
    if (action === 'unfollow') {
      // Remover relacionamento de seguimento
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        isFollowing: false,
        message: 'Usuário deixado de seguir com sucesso' 
      });
    }

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro na API de follow:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}