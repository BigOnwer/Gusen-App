'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, Mail, User, Shield, AtSign, CheckCircle, Clock, Sparkles } from "lucide-react"

export default function AuthForm() {
  const [step, setStep] = useState<'email' | 'code' | 'name' | 'terms'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [isNewUser, setIsNewUser] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  // Se já estiver logado, redirecionar
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (session) {
    return <div>Redirecionando...</div> // ou um loading
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep('code')
        setMessage('Código enviado para seu email!')
        setResendTimer(60)
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setMessage(data.error || 'Erro ao enviar código')
      }
    } catch {
      setMessage('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.isNewUser) {
          // Usuário novo - ir para completar perfil
          setIsNewUser(true)
          setStep('name')
          setMessage('Bem-vindo! Complete seu perfil para continuar.')
        } else if (data.shouldSignIn) {
          // Usuário existente - fazer login com NextAuth
          const result = await signIn('credentials', {
            email,
            code,
            redirect: false
          })

          if (result?.ok) {
            setMessage('Login realizado com sucesso!')
            router.push('/dashboard')
          } else {
            setMessage('Erro ao fazer login. Tente novamente.')
          }
        }
      } else {
        setMessage(data.error || 'Código inválido')
      }
    } catch {
      setMessage('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !username) return

    setStep('terms')
  }

  const handleTermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) return

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, name, username, acceptedTerms }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.shouldSignIn) {
          // Fazer login após completar perfil
          const result = await signIn('credentials', {
            email,
            code,
            redirect: false
          })

          if (result?.ok) {
            setMessage(`Conta criada com sucesso! Bem-vindo, ${name}!`)
            router.push('/dashboard')
          } else {
            setMessage('Conta criada, mas erro no login. Tente fazer login novamente.')
          }
        }
      } else {
        setMessage(data.error || 'Erro ao criar conta')
      }
    } catch {
      setMessage('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'code') {
      setStep('email')
      setCode('')
      setMessage('')
    } else if (step === 'name') {
      setStep('code')
      setName('')
      setUsername('')
      setMessage('')
    } else if (step === 'terms') {
      setStep('name')
      setAcceptedTerms(false)
      setMessage('')
    }
  }

  const handleResendCode = async () => {
    if (resendTimer > 0) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setMessage('Novo código enviado!')
        setResendTimer(60)
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch {
      setMessage('Erro ao reenviar código')
    } finally {
      setIsLoading(false)
    }
  }

  const getStepInfo = () => {
    switch (step) {
      case 'email':
        return {
          title: 'Bem-vindo!',
          description: 'Digite seu email para começar sua jornada',
          icon: <Mail className="h-8 w-8 text-primary" />,
        }
      case 'code':
        return {
          title: 'Verificação Segura',
          description: 'Confirme sua identidade com o código enviado',
          icon: <Shield className="h-8 w-8 text-primary" />,
        }
      case 'name':
        return {
          title: 'Personalize seu Perfil',
          description: 'Como você gostaria de ser conhecido?',
          icon: <User className="h-8 w-8 text-primary" />,
        }
      case 'terms':
        return {
          title: 'Última Etapa!',
          description: 'Aceite os termos para finalizar sua conta',
          icon: <CheckCircle className="h-8 w-8 text-primary" />,
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-accent/10 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">{stepInfo.icon}</div>
          <CardTitle className="text-3xl font-bold">
            {stepInfo.title}
          </CardTitle>
          <CardDescription className="text-base">{stepInfo.description}</CardDescription>

          <div className="flex justify-center space-x-2 mt-4">
            {['email', 'code', 'name', 'terms'].map((stepName, index) => (
              <div
                key={stepName}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  stepName === step
                    ? 'bg-primary w-8'
                    : ['email', 'code', 'name', 'terms'].indexOf(step) > index
                      ? 'bg-primary'
                      : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-2 focus:border-primary transition-all duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold transform hover:scale-[1.02]"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando código...
                  </div>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="verification" className="text-sm font-medium">
                  Código de Verificação
                </Label>
                <div className="relative group">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="verification"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-10 text-center tracking-widest h-12 border-2 focus:border-primary transition-all duration-200 text-lg font-mono"
                    required
                    disabled={isLoading}
                    autoFocus
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="bg-gradient-to-r from-muted/50 to-accent/10 p-4 rounded-lg border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Código enviado para:</p>
                    <p className="font-semibold text-foreground">{email}</p>
                  </div>
                  {resendTimer > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {resendTimer}s
                    </div>
                  )}
                </div>
                {resendTimer === 0 && (
                  <Button 
                    type="button"
                    variant="link" 
                    className="p-0 h-auto text-primary text-sm mt-2"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Reenviar código
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 h-12 border-2 bg-transparent"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={isLoading || !code}
                >
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </form>
          )}

          {step === 'name' && (
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome Completo
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12 border-2 focus:border-primary transition-all duration-200"
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Nome de Usuário
                  </Label>
                  <div className="relative group">
                    <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="seuusuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="pl-10 h-12 border-2 focus:border-primary transition-all duration-200"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Apenas letras minúsculas, números e underscore
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-muted/50 to-accent/10 p-4 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">Email confirmado:</p>
                <p className="font-semibold text-foreground">{email}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 h-12 border-2 bg-transparent"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  disabled={isLoading || !name || !username}
                >
                  Continuar
                </Button>
              </div>
            </form>
          )}

          {step === 'terms' && (
            <form onSubmit={handleTermsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-muted/30 to-accent/5 p-6 rounded-lg border border-border/50 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold mb-3 text-foreground flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Termos de Uso
                  </h4>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Ao criar uma conta, você concorda com nossos termos de uso e política de privacidade.</p>
                    <p>
                      Seus dados serão tratados com segurança e não serão compartilhados com terceiros sem seu
                      consentimento.
                    </p>
                    <p>Você pode cancelar sua conta a qualquer momento através das configurações.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg border border-border/50">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    Eu aceito os termos de uso e política de privacidade
                  </Label>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2 text-foreground">Resumo da Conta:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Nome:</span> <span className="font-medium">{name}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Usuário:</span>{' '}
                    <span className="font-medium">@{username}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span> <span className="font-medium">{email}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 h-12 border-2 bg-transparent"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 transform hover:scale-[1.02] transition-all duration-200"
                  disabled={isLoading || !acceptedTerms}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando conta...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {message && (
            <div className={`mt-4 p-4 rounded-lg border ${
              message.includes('sucesso') || message.includes('Bem-vindo') || message.includes('enviado')
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            }`}>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}