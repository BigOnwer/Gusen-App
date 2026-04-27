<div align="center">

# 🌐 Gusen App

### Rede Social com Chat em Tempo Real

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)

**[📋 Reportar Bug](https://github.com/BigOnwer/Gusen-App/issues)** • **[💡 Sugerir Feature](https://github.com/BigOnwer/Gusen-App/issues)**

> 🚧 **Projeto de portfólio em desenvolvimento.** Deploy ainda não disponível publicamente.

</div>

---

## 📖 Sobre o Projeto

O **Gusen App** é uma rede social full-stack com chat em tempo real, construída como projeto de estudo e portfólio. A aplicação combina funcionalidades típicas de redes sociais — perfis, conexões entre usuários — com comunicação instantânea via WebSockets, tudo isso sobre uma base moderna com autenticação segura, verificação por OTP e envio de e-mails transacionais.

O projeto tem como foco explorar na prática o desenvolvimento de aplicações real-time com Next.js 15, React 19 e Socket.io, integrando um stack moderno de ponta a ponta.

---

## ✨ Funcionalidades

- 🔐 **Autenticação completa** via NextAuth.js com suporte a sessões seguras
- 🔢 **Verificação por OTP** com `input-otp` para validação de identidade
- 💬 **Chat em tempo real** com Socket.io (cliente e servidor)
- 👤 **Perfis de usuário** com avatar, informações e preferências
- 🌓 **Tema claro/escuro** com `next-themes`
- 📧 **E-mails transacionais** via Resend e Nodemailer
- 🔒 **Rotas protegidas** com middleware Next.js (dashboard, perfil, APIs)
- 🗓️ **Formatação de datas** com `date-fns`
- 🔔 **Notificações** de feedback com Sonner

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 15 (App Router + Turbopack) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS v4 + tw-animate-css |
| **Componentes UI** | Radix UI + Lucide React |
| **ORM / Banco** | Prisma |
| **Autenticação** | NextAuth.js v4 |
| **Tempo Real** | Socket.io (cliente + servidor) |
| **E-mail** | Resend + Nodemailer |
| **Validação** | Zod |
| **Notificações** | Sonner |
| **HTTP Client** | Axios |
| **Utilitários** | date-fns, uuid, bcrypt, jsonwebtoken |
| **Deploy** | Vercel |

---

## 🗂️ Estrutura do Projeto

```
gusen-app/
├── app/                  # Rotas e páginas (Next.js App Router)
├── components/           # Componentes reutilizáveis da UI
├── hooks/                # Custom hooks
├── lib/                  # Configurações de auth, prisma e utilitários
├── prisma/               # Schema e migrations do banco de dados
├── public/               # Assets estáticos
├── types/                # Tipos e interfaces TypeScript globais
├── middleware.ts          # Proteção de rotas autenticadas
└── next.config.ts        # Configuração do Next.js
```

### Rotas protegidas pelo middleware

```
/dashboard/*   →  requer autenticação
/profile/*     →  requer autenticação
/api/user/*    →  requer autenticação
/api/users/*   →  requer autenticação
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Banco de dados compatível com Prisma (PostgreSQL recomendado)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/BigOnwer/Gusen-App.git
cd Gusen-App

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Execute as migrations do banco
npx prisma migrate dev

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/gusen_app"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu_secret_aqui"

# E-mail — Resend
RESEND_API_KEY="re_..."

# E-mail — Nodemailer (alternativo)
EMAIL_HOST="smtp.exemplo.com"
EMAIL_PORT=587
EMAIL_USER="seu@email.com"
EMAIL_PASS="sua_senha"

# JWT (para tokens customizados)
JWT_SECRET="seu_jwt_secret"
```

---

## 🏗️ Arquitetura em Destaque

### Autenticação em camadas
O projeto combina **NextAuth.js** para gerenciamento de sessão com verificação adicional por **OTP** e **JWT customizado**, criando um fluxo de autenticação robusto e seguro.

### Chat em tempo real
Comunicação bidirecional com **Socket.io** integrado ao Next.js, permitindo troca de mensagens instantânea entre usuários sem necessidade de polling.

### Proteção de rotas via Middleware
O `middleware.ts` intercepta todas as rotas sensíveis no edge, redirecionando usuários não autenticados antes mesmo de renderizar qualquer página.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

Feito com ☕ por **[Gustavo Leal](https://github.com/BigOnwer)**

</div>
