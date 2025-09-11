//components/SocialChat.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConversationWithDetails, MessageWithSender } from "@/types/social";
import { User } from "@prisma/client";
import { Send, Search, Phone, Video, MoreVertical, MessageCircle, Plus, UserPlus, Loader2, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialChatProps {
  currentUser: User;
  onUnreadCountChange?: (count: number) => void; // Adicionar callback
}

interface SearchedUser {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
}

export function SocialChat({ currentUser, onUnreadCountChange }: SocialChatProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para nova conversa
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<SearchedUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Notificar mudanças na contagem de não lidas
  useEffect(() => {
    const totalUnread = getTotalUnreadCount();
    onUnreadCountChange?.(totalUnread);
  }, [conversations]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      loadMessages();
      markAsRead();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Busca por usuários com debounce
  useEffect(() => {
    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    if (userSearchQuery.trim().length >= 2) {
      userSearchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 500);
    } else {
      setSearchedUsers([]);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/conversations?userId=${currentUser.id}`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async () => {
    if (!activeConversation) return;

    try {
      const response = await fetch(`/api/messages?conversationId=${activeConversation.id}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const markAsRead = async () => {
    if (!activeConversation) return;

    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          userId: currentUser.id
        }),
      });
      // Recarregar conversas para atualizar contadores
      loadConversations();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) return;

    setIsSearchingUsers(true);
    try {
      const response = await fetch(`/api/user/search?query=${encodeURIComponent(userSearchQuery)}&excludeId=${currentUser.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const createConversation = async (targetUserId: string) => {
    setIsCreatingConversation(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: [currentUser.id, targetUserId],
          isGroup: false
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        await loadConversations();
        setActiveConversation(data.conversation);
        setIsNewConversationOpen(false);
        setUserSearchQuery("");
        setSearchedUsers([]);
      } else {
        console.error('Erro ao criar conversa:', data.error);
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          senderId: currentUser.id,
          conversationId: activeConversation.id
        }),
      });

      if (response.ok) {
        setNewMessage("");
        loadMessages();
        loadConversations();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationSelect = (conversation: ConversationWithDetails) => {
    setActiveConversation(conversation);
  };

  const getConversationName = (conversation: ConversationWithDetails) => {
    if (conversation.isGroup) {
      return conversation.name || "Grupo";
    }
    
    const otherUser = conversation.users.find(u => u.user.id !== currentUser.id)?.user;
    return otherUser?.name || otherUser?.username || "Usuário";
  };

  const getConversationAvatar = (conversation: ConversationWithDetails) => {
    if (conversation.isGroup) {
      return null;
    }
    
    const otherUser = conversation.users.find(u => u.user.id !== currentUser.id)?.user;
    return otherUser?.avatar;
  };

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMessageRead = (message: MessageWithSender, userId: string) => {
    return message.readBy.some(read => read.userId === userId);
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationName(conv).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de Conversas */}
      <div className="w-80 bg-white border-r">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Mensagens</h2>
              {getTotalUnreadCount() > 0 && (
                <Badge variant="destructive" className="rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs">
                  {getTotalUnreadCount()}
                </Badge>
              )}
            </div>
            <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por username..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <ScrollArea className="max-h-60">
                    {isSearchingUsers && (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {searchedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name || user.username}</p>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => createConversation(user.id)}
                            disabled={isCreatingConversation}
                          >
                            {isCreatingConversation ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {userSearchQuery.length >= 2 && !isSearchingUsers && searchedUsers.length === 0 && (
                      <div className="text-center p-4 text-gray-500">
                        Nenhum usuário encontrado
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 mb-1 relative",
                  activeConversation?.id === conversation.id && "bg-blue-50 border-blue-200"
                )}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={getConversationAvatar(conversation) || undefined} />
                  <AvatarFallback>
                    {getConversationName(conversation).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "truncate",
                      conversation.unreadCount && conversation.unreadCount > 0 ? "font-bold" : "font-medium"
                    )}>
                      {getConversationName(conversation)}
                    </h3>
                    <div className="flex items-center gap-1">
                      {conversation.messages[0] && (
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(conversation.messages[0].createdAt)}
                        </span>
                      )}
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="rounded-full min-w-[18px] h-4 flex items-center justify-center text-xs ml-1">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {conversation.messages[0] && (
                    <p className={cn(
                      "text-sm truncate",
                      conversation.unreadCount && conversation.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-600"
                    )}>
                      {conversation.messages[0].content}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1">
                    {conversation.isGroup && (
                      <Badge variant="secondary" className="text-xs">
                        {conversation.users.length} membros
                      </Badge>
                    )}
                    {!conversation.isGroup && conversation.users.find(u => u.user.id !== currentUser.id)?.user.isOnline && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Chat Principal */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header do Chat */}
            <div className="bg-white border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={getConversationAvatar(activeConversation) || undefined} />
                  <AvatarFallback>
                    {getConversationName(activeConversation).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {getConversationName(activeConversation)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeConversation.isGroup 
                      ? `${activeConversation.users.length} membros`
                      : activeConversation.users.find(u => u.user.id !== currentUser.id)?.user.isOnline 
                        ? "Online" 
                        : "Offline"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4 h-96">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.senderId === currentUser.id && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender.avatar || undefined} />
                      <AvatarFallback>
                        {message.sender.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn(
                      "flex flex-col max-w-xs lg:max-w-md",
                      message.senderId === currentUser.id && "items-end"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.sender.name || message.sender.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      
                      <div className={cn(
                        "p-3 rounded-lg relative",
                        message.senderId === currentUser.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}>
                        {message.imageUrl && (
                          <img
                            src={message.imageUrl}
                            alt="Imagem da mensagem"
                            className="rounded mb-2 max-w-64"
                          />
                        )}
                        <p className="text-sm">{message.content}</p>
                        
                        {/* Indicador de leitura para mensagens próprias */}
                        {message.senderId === currentUser.id && (
                          <div className="flex justify-end mt-1">
                            {activeConversation.isGroup ? (
                              // Para grupos, mostrar quantos leram
                              <div className="flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                <span className="text-xs">
                                  {message.readBy.filter(read => read.userId !== currentUser.id).length}
                                </span>
                              </div>
                            ) : (
                              // Para conversas individuais, mostrar se foi lida
                              isMessageRead(message, activeConversation.users.find(u => u.user.id !== currentUser.id)?.user.id || '') ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="bg-white border-t p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  placeholder="Digite uma mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!newMessage.trim() || isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500">
                Escolha uma conversa para começar a trocar mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}