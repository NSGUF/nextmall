import '@/styles/globals.css';

import { type Metadata } from 'next';
import { Provider } from './provider';
import { TRPCReactProvider } from '@/trpc/react';


const SITE_URL = process.env.NEXTAUTH_URL || 'https://yunzhiqiao.site';
const SITE_NAME = '云智乔';
const DEFAULT_TITLE = process.env.TITLE || '云智乔 - 免费在线工具集合';
const DEFAULT_DESCRIPTION =
    '云智乔提供丰富免费在线工具，涵盖图片处理（压缩 / 加水印 / 格式转换）、GIF 动画（生成 / 裁切 / 压缩）、二维码生成美化、编程工具、创意工具（奖状生成、ASCII 字符画）等，无需安装，浏览器直接使用，一站式解决图片、开发、娱乐等实用需求';
    export async function generateMetadata(): Promise<Metadata> {
        return  {
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
