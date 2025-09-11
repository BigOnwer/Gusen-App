import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, code, name, username, acceptedTerms } = await req.json()

    console.log("=== Complete Profile API Called ===")
    console.log("Email:", email)
    console.log("Name:", name)
    console.log("Username:", username)
    console.log("Accepted terms:", acceptedTerms)

    if (!email || !code || !name || !username || !acceptedTerms) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    const usernameRegex = /^[a-z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username deve conter apenas letras minúsculas, números e underscore' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Username deve ter entre 3 e 20 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se código ainda é válido
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    })

    console.log("Verification code valid:", !!verificationCode)

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Verificar se username já existe
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Este nome de usuário já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se já existe usuário com este email
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    })

    let user;

    try {
      if (!existingUser) {
        // Criar novo usuário
        console.log("Creating new user")
        user = await prisma.user.create({
          data: {
            email,
            name,
            username,
            avatar: '',
            bio: '',
            verified: true,
            acceptedTermsAt: new Date()
          }
        })
      } else {
        // Atualizar usuário existente
        console.log("Updating existing user")
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            username,
            verified: true,
            acceptedTermsAt: new Date()
          }
        })
      }

      console.log("User created/updated successfully:", user.id)

      // NÃO marcar código como usado aqui - NextAuth fará isso na hora do signIn
      // Isso permite que o NextAuth ainda possa usar o código para autenticar

      return NextResponse.json({
        message: 'Perfil completado com sucesso',
        shouldSignIn: true, // Frontend deve chamar NextAuth signIn
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          verified: user.verified,
          avatar: '',
          bio: '',
        }
      })

    } catch (dbError: any) {
      console.error('Database error:', dbError)
      
      if (dbError.code === 'P2002') {
        if (dbError.meta?.target?.includes('username')) {
          return NextResponse.json(
            { error: 'Este nome de usuário já está em uso' },
            { status: 400 }
          )
        }
        if (dbError.meta?.target?.includes('email')) {
          return NextResponse.json(
            { error: 'Este email já está cadastrado' },
            { status: 400 }
          )
        }
      }
      
      throw dbError
    }

  } catch (error) {
    console.error('Erro ao completar perfil:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
