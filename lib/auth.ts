import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" }
      },
      async authorize(credentials) {
        console.log("=== NextAuth Authorize Called ===")
        console.log("Email:", credentials?.email)
        console.log("Code:", credentials?.code?.substring(0, 2) + "****")
        
        if (!credentials?.email || !credentials?.code) {
          console.log("Missing credentials")
          return null
        }

        try {
          // Verificar código
          const verificationCode = await prisma.verificationCode.findFirst({
            where: {
              email: credentials.email,
              code: credentials.code,
              used: false,
              expiresAt: { gt: new Date() }
            }
          })

          console.log("Verification code found:", !!verificationCode)

          if (!verificationCode) {
            console.log("Invalid or expired verification code")
            return null
          }

          // Buscar usuário
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log("User found:", !!user)
          console.log("User has complete profile:", !!(user?.name && user?.username))

          if (!user) {
            console.log("User not found")
            return null
          }

          // Verificar se usuário tem perfil completo
          if (!user.name || !user.username) {
            console.log("User profile incomplete")
            return null
          }

          // AGORA SIM marcar código como usado
          await prisma.verificationCode.update({
            where: { id: verificationCode.id },
            data: { used: true }
          })

          console.log("Authentication successful for:", user.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            isVerified: user.isVerified,
            avatar: user.avatar
          }
        } catch (error) {
          console.error("Error in NextAuth authorize:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.username = (user as any).username
        token.isVerified = (user as any).isVerified
        token.avatar = (user as any).avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.userId as string
        ;(session.user as any).username = token.username as string
        ;(session.user as any).isVerified = token.isVerified as boolean
        (session.user as any).avatar = token.avatar as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth',
  },
  debug: process.env.NODE_ENV === 'development',
}