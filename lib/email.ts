import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, code: string) {
  try {
    console.log('📧 Enviando email para:', email)
    console.log('🔑 Usando API Key:', process.env.RESEND_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA')

    const { data, error } = await resend.emails.send({
      from: 'noreply@resend.dev', // Para testes
      to: email,
      subject: 'Código de Verificação',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin: 0;">Código de Verificação</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h2 style="color: white; margin: 0 0 10px 0;">Seu código é:</h2>
            <div style="background: white; padding: 15px; border-radius: 8px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Este código expira em <strong>15 minutos</strong>.</p>
            <p>Se você não solicitou este código, ignore este email.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('❌ Erro do Resend:', error)
      throw new Error(error.message)
    }

    console.log('✅ Email enviado com sucesso:', data?.id)
    return data
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    throw new Error(`Falha ao enviar email: ${error}`)
  }
}