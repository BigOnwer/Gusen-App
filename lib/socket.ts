import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { userId }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado ao socket');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado do socket');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return { socket, isConnected };
}