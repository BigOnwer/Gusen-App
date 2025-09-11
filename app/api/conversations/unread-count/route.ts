// api/conversations/unread-count/route.ts

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

    // Buscar todas as conversas do usuário
    const conversations = await prisma.conversation.findMany({
      where: {
        users: {
          some: { userId }
        }
      },
      select: {
        id: true
      }
    });

    // Calcular total de mensagens não lidas
    let totalUnread = 0;
    
    for (const conversation of conversations) {
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          readBy: {
            none: { userId }
          }
        }
      });
      totalUnread += unreadCount;
    }

    return NextResponse.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Erro ao buscar contagem de mensagens não lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}