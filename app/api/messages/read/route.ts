// api/messages/read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userId } = await request.json();

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'ConversationId e UserId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar todas as mensagens não lidas da conversa
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId }, // Não marcar as próprias mensagens
        readBy: {
          none: { userId }
        }
      },
      select: { id: true }
    });

    // Marcar todas como lidas
    if (unreadMessages.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadMessages.map(message => ({
          messageId: message.id,
          userId
        })),
        skipDuplicates: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      markedAsRead: unreadMessages.length 
    });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}