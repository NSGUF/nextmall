import '@/styles/globals.css';

import { type Metadata } from 'next';
import { Provider } from './provider';
import { TRPCReactProvider } from '@/trpc/react';

export const metadata: Metadata = {
    title: process.env.TITLE,
    description: process.env.DESCRIPTION,
    icons: [{ rel: 'icon', url: '/logo.svg' }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh">
            <body>
                <Provider>
                    <TRPCReactProvider>{children}</TRPCReactProvider>
                </Provider>
            </body>
        </html>
    );
}
