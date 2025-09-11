import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    username?: string
    verified?: boolean
  }

  interface Session {
    user: {
      id: string;
      caption?: string;
      mediaUrl: string;
      mediaType: MediaType;
      userId: string;
      isActive: boolean;
      expiresAt: string;
      createdAt: string;
      updatedAt: string;
      id: string;
      username: string;
      name?: string;
      avatar?: string;
    }
  }

  interface JWT {
    userId?: string
    username?: string
    verified?: boolean
    avatar?: string
  }
}