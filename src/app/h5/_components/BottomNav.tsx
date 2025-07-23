'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    FiHome,
    FiGrid,
    FiVideo,
    FiShoppingCart,
    FiUser,
} from 'react-icons/fi';

const navs = [
    { href: '/h5', label: '首页', icon: FiHome },
    { href: '/h5/category', label: '分类', icon: FiGrid },
    { href: '/h5/video', label: '视频', icon: FiVideo },
    { href: '/h5/cart', label: '购物车', icon: FiShoppingCart },
    { href: '/h5/me', label: '我的', icon: FiUser },
];

export default function BottomNav() {
    const pathname = usePathname();
    return (
        <nav
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                height: 64,
                background: '#fff',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                zIndex: 100,
            }}
        >
            {navs.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                    <Link
                        key={href}
                        href={href}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: active ? '#f00' : '#333',
                            textDecoration: 'none',
                            fontSize: 12,
                        }}
                    >
                        <Icon size={28} color={active ? '#f00' : '#333'} />
                        <span style={{ marginTop: 4 }}>{label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
