import { Post, Message, Conversation, Story, ConversationUser, MessageRead } from '@prisma/client';
import { User } from './user';

export type UserWithStats = User & {
  _count: {
    followers: number;
    following: number;
    posts: number;
  };
  isFollowing?: boolean;
  isFollowedBy?: boolean;
};

export type PostWithDetails = Post & {
  author: User;
  _count: {
    likes: number;
    comments: number;
  };
  likes: { userId: string }[];
  comments: (Comment & { user: User })[];
  isLiked?: boolean;
};

export type MessageWithSender = Message & {
  sender: User;
  receiver?: User;
  readBy: MessageRead[];
};

export type ConversationWithDetails = Conversation & {
  users: (ConversationUser & { user: User })[];
  messages: MessageWithSender[];
  _count: {
    messages: number;
  };
  lastMessage?: MessageWithSender;
  unreadCount?: number;
};

export type StoryWithAuthor = Story & {
  author: User;
};

export interface ChatState {
  currentUser: User | null;
  conversations: ConversationWithDetails[];
  activeConversation: ConversationWithDetails | null;
  onlineUsers: User[];
}