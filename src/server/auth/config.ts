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
                try {
                    const { email, password } = credentials ?? {};

                    if (!email || !password) {
                        console.log('Missing email or password');
                        return null;
                    }

                    console.log('Attempting login for:', email);

                    const user = await db.user.findUnique({
                        where: { email: email as string },
                    });

                    if (!user) {
                        console.log('User not found:', email);
                        return null;
                    }

                    if (!user.password) {
                        console.log('User has no password:', email);
                        return null;
                    }

                    console.log('Comparing passwords...');
                    const isValid = await compare(
                        password as string,
                        user.password
                    );

                    if (!isValid) {
                        console.log('Invalid password for:', email);
                        return null;
                    }

                    console.log('Login successful for:', email);
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
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
