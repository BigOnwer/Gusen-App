import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    console.log("=== Send Code API Called ===")
    console.log("Email:", email)

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar se não existe um código recente (menos de 1 minuto)
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) } // 1 minuto atrás
      }
    })

    if (recentCode) {
      return NextResponse.json(
        { error: 'Aguarde 1 minuto antes de solicitar um novo código' },
        { status: 429 }
      )
    }

    // Gerar código de 6 dígitos
    const code = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Invalidar códigos anteriores para este email
    await prisma.verificationCode.updateMany({
      where: { 
        email,
        used: false
      },
      data: { used: true }
    })

    // Criar novo código
    const verificationCode = await prisma.verificationCode.create({
      data: {
        email,
        code,
        expiresAt,
        used: false,
      }
    })
    sendVerificationEmail(email, code)

    console.log("Verification code created:", {
      id: verificationCode.id,
      email: verificationCode.email,
      code: verificationCode.code,
      expiresAt: verificationCode.expiresAt
    })

    // Aqui você enviaria o email com o código
    // Para desenvolvimento, vamos apenas logar
    console.log(`=== EMAIL PARA ENVIAR ===`)
    console.log(`Para: ${email}`)
    console.log(`Código: ${code}`)
    console.log(`Expira em: ${expiresAt}`)
    console.log(`========================`)

    return NextResponse.json({
      message: 'Código enviado com sucesso',
      // Em produção, remover estas informações de debug
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          code,
          expiresAt
        }
      })
    })

  } catch (error) {
    console.error('Erro ao enviar código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}