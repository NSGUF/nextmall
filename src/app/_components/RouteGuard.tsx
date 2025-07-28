'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RouteGuardProps {
    children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return;

        const userRole = session?.user?.role;

        // 跳过API路由和静态资源
        if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
            return;
        }

        // // 未登录用户 - 只能访问公开页面
        // if (!session) {
        //     if (
        //         pathname.startsWith('/admin') ||
        //         pathname.startsWith('/vendor')
        //     ) {
        //         router.replace('/h5');
        //         return;
        //     }
        // }
    }, [session, status, pathname, router]);

    return <>{children}</>;
}
