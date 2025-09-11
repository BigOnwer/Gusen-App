// api/users/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const excludeId = searchParams.get('excludeId');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } }
            ]
          },
          excludeId ? { id: { not: excludeId } } : {}
        ]
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true
      },
      take: 10,
      orderBy: [
        { username: 'asc' }
      ]
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}