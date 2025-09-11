// api/conversations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: { userId }
        }
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                isOnline: true
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true,
                name: true
              }
            },
            readBy: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calcular mensagens não lidas
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            readBy: {
              none: { userId }
            }
          }
        });

        return {
          ...conversation,
          unreadCount
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithUnread });
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, isGroup, userIds } = await request.json();

    // garantir que userIds é array válido e sem valores nulos
    if (!Array.isArray(userIds) || userIds.length < 2 || userIds.some((id) => !id)) {
      return NextResponse.json(
        { error: 'É necessário pelo menos 2 usuários válidos' },
        { status: 400 }
      );
    }

    // Verificar se já existe conversa entre os 2 usuários (somente 1:1)
    if (!isGroup && userIds.length === 2) {
      const [id1, id2] = userIds;

      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { users: { some: { userId: id1 } } },
            { users: { some: { userId: id2 } } }
          ]
        },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                  isOnline: true
                }
              }
            }
          }
        }
      });

      if (existingConversation) {
        return NextResponse.json({ conversation: existingConversation });
      }
    }

    // Criar nova conversa
    const conversation = await prisma.conversation.create({
      data: {
        name: name || null,
        isGroup: Boolean(isGroup),
        users: {
          create: userIds.map((userId: string, index: number) => ({
            userId,
            isAdmin: index === 0
          }))
        }
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                isOnline: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
