// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Tipos
interface UserResponse {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  createdAt: Date;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface GetUsersResponse {
  users: UserResponse[];
  pagination: PaginationInfo;
}

interface ApiError {
  error: string;
  details?: z.ZodIssue[];
}

// GET - Listar usuários (com busca e paginação)
export async function GET(request: NextRequest): Promise<NextResponse<GetUsersResponse | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const search: string = searchParams.get('search') || '';
    const page: number = parseInt(searchParams.get('page') || '1');
    const limit: number = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const skip: number = (page - 1) * limit;

    // Construir cláusula WHERE para busca
    const whereClause = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Buscar usuários e contar total em paralelo
    const [users, total]: [UserResponse[], number] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          name: true,
          bio: true,
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const pagination: PaginationInfo = {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: skip + limit < total,
      hasPrev: page > 1
    };

    const response: GetUsersResponse = {
      users,
      pagination
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}