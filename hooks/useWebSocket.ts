// hooks/useWebSocket.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: 'new_message' | 'user_typing' | 'user_online' | 'user_offline';
  data: any;
}

export function useWebSocket(userId?: string) {
  const socket = useRef<Socket | null>(null);
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    if (!userId) return;

    // Conectar ao WebSocket
    socket.current = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      auth: {
        userId
      }
    });

    socket.current.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.current.on('message', (message: WebSocketMessage) => {
      const handler = messageHandlers.current.get(message.type);
      if (handler) {
        handler(message.data);
      }
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [userId]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    messageHandlers.current.set(event, handler);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socket.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((conversationId: string) => {
    socket.current?.emit('join_conversation', { conversationId });
  }, []);

  const leaveRoom = useCallback((conversationId: string) => {
    socket.current?.emit('leave_conversation', { conversationId });
  }, []);

  return {
    on,
    emit,
    joinRoom,
    leaveRoom
  };
}

// Função auxiliar para obter ID do usuário atual
function getCurrentUserId(): string {
  // Implementar baseado na sua solução de autenticação
  // Por exemplo, decodificar do JWT ou buscar do contexto/session
  return ''; // Placeholder
}