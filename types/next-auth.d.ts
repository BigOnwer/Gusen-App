import NextAuth from "next-auth"
import { User } from "./user"

declare module "next-auth" {

  interface Session {
    user: User
  }

  interface JWT {
    userId?: string
    username?: string
    verified?: boolean
    avatar?: string
  }
}