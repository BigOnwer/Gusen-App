// app/api/follow/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Ajuste o caminho conforme sua estrutura

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetUserId = searchParams.get('targetUserId');

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: 'Parâmetros userId e targetUserId são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o usuário está seguindo o target
    const followRelation = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    // Opcionalmente, buscar estatísticas do usuário
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId: targetUserId },
      }),
      prisma.follow.count({
        where: { followerId: targetUserId },
      }),
    ]);

    return NextResponse.json({
      isFollowing: !!followRelation,
      followersCount,
      followingCount,
    });

  } catch (error) {
    console.error('Erro ao verificar status de seguimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}