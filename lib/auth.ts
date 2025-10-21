// lib/auth.ts

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        // Find teacher by email
        const teacher = await prisma.teacher.findUnique({
          where: { email: credentials.email },
        })

        if (!teacher || !teacher.passwordHash) {
          throw new Error('Invalid credentials')
        }

        // Verify password
        const passwordValid = await bcrypt.compare(
          credentials.password,
          teacher.passwordHash
        )

        if (!passwordValid) {
          throw new Error('Invalid credentials')
        }

        // Check if email is verified
        // TODO: Re-enable when production database has verification fields
        /*
        if (!teacher.emailVerified) {
          throw new Error('Please verify your email address before logging in')
        }
        */

        return {
          id: teacher.id,
          email: teacher.email,
          name: teacher.name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
