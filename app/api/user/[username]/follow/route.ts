// app/api/users/[username]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Tipos
interface SuccessResponse {
  message: string;
}

interface ApiError {
  error: string;
}

interface RouteParams {
  params: {
    username: string;
  };
}

// Schema de validação
const followSchema = z.object({
  followerId: z.string().uuid('ID do seguidor deve ser um UUID válido')
});

type FollowData = z.infer<typeof followSchema>;

// POST - Seguir usuário
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ApiError>> {
  try {
    const { username } = params;
    const body = await request.json();

    // Validar dados
    const { followerId }: FollowData = followSchema.parse(body);

    if (!username) {
      return NextResponse.json(
        { error: 'Username é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário a ser seguido
    const userToFollow = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!userToFollow) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Não pode seguir a si mesmo
    if (userToFollow.id === followerId) {
      return NextResponse.json(
        { error: 'Não é possível seguir a si mesmo' },
        { status: 400 }
      );
    }

    // Verificar se o seguidor existe
    const followerExists = await prisma.user.findUnique({
      where: { id: followerId },
      select: { id: true }
    });

    if (!followerExists) {
      return NextResponse.json(
        { error: 'Seguidor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já segue
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userToFollow.id
        }
      }
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Já segue este usuário' },
        { status: 409 }
      );
    }

    // Criar follow
    await prisma.follow.create({
      data: {
        followerId,
        followingId: userToFollow.id
      }
    });

    return NextResponse.json({ 
      message: 'Usuário seguido com sucesso' 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    console.error('Erro ao seguir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deixar de seguir usuário
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SuccessResponse | ApiError>> {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
    const followerId = searchParams.get('followerId');

    if (!username) {
      return NextResponse.json(
        { error: 'Username é obrigatório' },
        { status: 400 }
      );
    }

    if (!followerId) {
      return NextResponse.json(
        { error: 'ID do seguidor é obrigatório' },
        { status: 400 }
      );
    }

    // Validar se followerId é um UUID válido
    try {
      z.string().uuid().parse(followerId);
    } catch {
      return NextResponse.json(
        { error: 'ID do seguidor deve ser um UUID válido' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o follow existe antes de tentar deletar
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: user.id
        }
      }
    });

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Você não segue este usuário' },
        { status: 404 }
      );
    }

    // Deletar follow
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: user.id
        }
      }
    });

    return NextResponse.json({ 
      message: 'Deixou de seguir o usuário' 
    });

  } catch (error) {
    console.error('Erro ao deixar de seguir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}