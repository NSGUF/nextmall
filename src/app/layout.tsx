import '@/styles/globals.css';

import { type Metadata } from 'next';
import { Provider } from './provider';
import { TRPCReactProvider } from '@/trpc/react';

const SITE_URL = process.env.NEXTAUTH_URL || 'https://yunzhiqiao.site';
const SITE_NAME = '云智乔';
const DEFAULT_TITLE = process.env.TITLE || '星禾屿';
const DEFAULT_DESCRIPTION =
    '是一款专为烘焙爱好者、家庭主厨和专业甜点师打造的智能烘焙助手。无论你是新手小白还是烘焙达人，这里都能为你提供精准的配方指导、智能化的烘焙工具、个性化的创意灵感，让你的每一份甜点都成为艺术品';
export async function generateMetadata(): Promise<Metadata> {
    return {
        metadataBase: new URL(SITE_URL),
        title: {
            default: DEFAULT_TITLE,
            template: `%s - ${SITE_NAME}`,
        },
        description: DEFAULT_DESCRIPTION,
        keywords: DEFAULT_DESCRIPTION,
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
    };
}

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
