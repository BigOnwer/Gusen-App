// app/api/users/[username]/route.ts
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
  updatedAt: Date;
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
}

interface ApiError {
  error: string;
  details?: z.ZodIssue[];
}

interface DeleteResponse {
  message: string;
}

interface RouteParams {
  params: {
    username: string;
  };
}

// Schema de validação para atualização
const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
  avatar: z.string().url('URL do avatar inválida').optional()
});

type UpdateUserData = z.infer<typeof updateUserSchema>;

// GET - Buscar usuário por username
export async function GET(
  request: NextRequest, 
  { params }: RouteParams
): Promise<NextResponse<UserResponse | ApiError>> {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username é obrigatório' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<UserResponse | ApiError>> {
  try {
    const { username } = params;
    const body = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username é obrigatório' },
        { status: 400 }
      );
    }

    // Validar dados
    const validatedData: UpdateUserData = updateUserSchema.parse(body);

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { username: username.toLowerCase() },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
        },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<DeleteResponse | ApiError>> {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar usuário (cascade vai deletar relacionamentos)
    await prisma.user.delete({
      where: { username: username.toLowerCase() }
    });

    return NextResponse.json({ 
      message: 'Usuário deletado com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}