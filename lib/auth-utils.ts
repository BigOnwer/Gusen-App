export function generateVerificationCode(): string {
  return Math.random().toString().substr(2, 6).padStart(6, '0')
}

export function getCodeExpiration(): Date {
  return new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
}