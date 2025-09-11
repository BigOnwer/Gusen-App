import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()

    console.log("=== Verify Code API Called ===")
    console.log("Email:", email)
    console.log("Code:", code?.substring(0, 2) + "****")

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar código válido
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    })

    console.log("Verification code found:", !!verificationCode)
    console.log("Code used:", verificationCode?.used)
    console.log("Code expires at:", verificationCode?.expiresAt)

    if (!verificationCode) {
      // Debug: Listar códigos recentes para este email
      const recentCodes = await prisma.verificationCode.findMany({
        where: { email },
        orderBy: { createdAt: 'desc' },
        take: 3
      })

      console.log("Recent codes for email:", recentCodes.map(c => ({
        code: c.code.substring(0, 2) + "****",
        used: c.used,
        expired: c.expiresAt < new Date(),
        createdAt: c.createdAt
      })))

      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        verified: true
      }
    })

    console.log("Existing user found:", !!existingUser)
    console.log("User has complete profile:", !!(existingUser?.name && existingUser?.username))

    if (existingUser && existingUser.name && existingUser.username) {
      // Usuário existente com perfil completo
      // NÃO marcar código como usado aqui - NextAuth fará isso
      console.log("Returning existing user flow")

      return NextResponse.json({
        message: 'Código verificado com sucesso',
        isNewUser: false,
        shouldSignIn: true, // Frontend deve chamar NextAuth signIn
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          username: existingUser.username,
          verified: existingUser.verified
        }
      })
    } else {
      // Usuário novo ou sem perfil completo
      console.log("Returning new user flow")

      return NextResponse.json({
        message: 'Código verificado - complete seu perfil',
        isNewUser: true,
        shouldSignIn: false,
        // NÃO marcar código como usado ainda - será usado após completar perfil
      })
    }
  } catch (error) {
    console.error('Erro ao verificar código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}