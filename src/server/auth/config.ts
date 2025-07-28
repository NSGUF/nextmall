import { PrismaAdapter } from '@auth/prisma-adapter';
import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

import { db } from '@/server/db';
import type { ROLES } from '@/app/const/status';

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            phone?: string;
            role?: ROLES;
            // ...other properties
        } & DefaultSession['user'];
    }

    interface User {
        email?: string | null;
        name?: string | null;
        phone?: string | null;
        role?: string;
    }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    session: {
        strategy: 'jwt', // 显式指定
        maxAge: 30 * 24 * 60 * 60, // 30天
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                phone: {
                    label: 'Phone',
                    type: 'tel',
                    placeholder: '请输入手机号',
                },
                password: {
                    label: 'Password',
                    type: 'password',
                    placeholder: '请输入密码',
                },
            },
            async authorize(credentials) {
                try {
                    const { phone, password } = credentials ?? {};

                    if (!phone || !password) {
                        console.log('Missing phone or password');
                        return null;
                    }

                    console.log('Attempting login for:', phone);

                    // 支持手机号登录
                    const user = await db.user.findFirst({
                        where: { phone: phone as string },
                    });

                    if (!user) {
                        console.log('User not found:', phone);
                        return null;
                    }

                    if (!user.password) {
                        console.log('User has no password:', phone);
                        return null;
                    }

                    console.log('Comparing passwords...');
                    const isValid = await compare(
                        password as string,
                        user.password
                    );

                    if (!isValid) {
                        console.log('Invalid password for:', phone);
                        return null;
                    }

                    console.log('Login successful for:', phone);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        phone: user.phone,
                        role: user.role,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
    ],
    // 使用JWT策略时不需要adapter
    // adapter: PrismaAdapter(db),
    callbacks: {
        session: async ({ session, token }) => {
            // 使用JWT策略时，优先使用token中的信息
            return {
                ...session,
                user: {
                    ...session.user,
                    id: (token?.id as string) ?? session.user?.id,
                    email: token?.email ?? session.user?.email,
                    name: token?.name ?? session.user?.name,
                    phone: token?.phone as string,
                    role: token?.role as string,
                },
            };
        },
        jwt: async ({ token, user }) => {
            // 登录时把user信息放进token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.phone = (user as any).phone;
                token.role = (user as any).role;
            }
            return token;
        },
    },
} satisfies NextAuthConfig;
