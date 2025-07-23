import { PrismaAdapter } from '@auth/prisma-adapter';
import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

import { db } from '@/server/db';

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
            // ...other properties
            // role: UserRole;
        } & DefaultSession['user'];
    }

    // interface User {
    //   // ...other properties
    //   // role: UserRole;
    // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt', // 显式指定
        maxAge: 30 * 24 * 60 * 60, // 30天
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                    placeholder: '请输入邮箱',
                },
                password: {
                    label: 'Password',
                    type: 'password',
                    placeholder: '请输入密码',
                },
            },
            async authorize(credentials, req) {
                const { email, password } = credentials ?? {};
                if (!email || !password) return null;
                const user = await db.user.findUnique({ where: { email } });
                if (!user || !user.password) return null;
                const isValid = await compare(password, user.password);
                if (!isValid) return null;
                return { id: user.id, email: user.email, name: user.name };
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
        session: async ({ session, token, user }) => {
            // token存在时优先用token
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token?.id ?? user?.id,
                    email: token?.email ?? user?.email,
                    name: token?.name ?? user?.name,
                },
            };
        },
        jwt: async ({ token, user }) => {
            // 登录时把user信息放进token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
    },
} satisfies NextAuthConfig;
