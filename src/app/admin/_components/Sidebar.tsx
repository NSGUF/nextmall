'use client';

import React, { memo, useEffect, useState } from 'react';
import {
    FiBox,
    FiBook,
    FiHome,
    FiDollarSign,
    FiUsers,
    FiSettings,
    FiMonitor,
    FiActivity,
    FiCircle as Dot,
    FiChevronDown as ChevronDown,
    FiBookOpen,
    FiCreditCard,
    FiShoppingBag,
    FiFileText,
    FiBarChart,
} from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Heading, Image, Text, Wrap } from '@chakra-ui/react';
import { Button } from '@/app/_components/ui';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/app/const/status';

const Sidebar = () => {
    const { data: session } = useSession();
    const userRole = session?.user?.role;

    type NavTreeType = {
        title: string;
        url: string;
        icon?: React.ComponentType<any>;
        subMenu?: NavTreeType[];
        roles?: string[]; // 允许访问的角色
    };

    // 所有菜单项
    const allNavItems: NavTreeType[] = [
        {
            title: '首页',
            url: '/admin',
            icon: FiHome,
            roles: [ROLES.SUPERADMIN], // 所有管理员都能看到
        },
        {
            title: 'banner管理',
            url: '/admin/banner',
            icon: FiBookOpen,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '用户管理',
            url: '/admin/user',
            icon: FiUsers,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '商品分类',
            url: '/admin/category',
            icon: FiMonitor,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '商品管理',
            url: '/admin/product',
            icon: FiBook,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '课程分类',
            url: '/admin/video/collection',
            icon: FiActivity,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '课程管理',
            url: '/admin/video/course',
            icon: FiDollarSign,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '订单管理',
            url: '/admin/order',
            icon: FiShoppingBag,
            roles: [ROLES.SUPERADMIN], // 商户和超级管理员都能看到
        },
        {
            title: '支付码管理',
            url: '/admin/payment',
            icon: FiCreditCard,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '操作日志',
            url: '/admin/log',
            icon: FiFileText,
            roles: [ROLES.SUPERADMIN], // 只有超级管理员能看到
        },
        {
            title: '供应商数据',
            url: '/admin/data',
            icon: FiBarChart,
            roles: [ROLES.SUPERADMIN], // 商户和超级管理员都能看到
        },
        {
            title: '首页',
            url: '/vendor',
            icon: FiHome,
            roles: [ROLES.VENDOR], // 所有管理员都能看到
        },
        {
            title: '订单管理',
            url: '/vendor/order',
            icon: FiShoppingBag,
            roles: [ROLES.VENDOR], // 商户和超级管理员都能看到
        },
        {
            title: '供应商数据',
            url: '/vendor/data',
            icon: FiBarChart,
            roles: [ROLES.VENDOR], // 商户和超级管理员都能看到
        },
    ];

    // 根据用户角色过滤菜单项
    const navTree = allNavItems.filter((item) => {
        if (!item.roles) return true; // 如果没有指定角色，默认所有人都能看到
        return userRole && item.roles.includes(userRole);
    });

    // Sidebar Items
    const SidebarItem = ({ title, url, icon: Icon, subMenu }: NavTreeType) => {
        const activeLinkPath = usePathname();
        const [subMenuOpen, setSubMenuOpen] = useState(false);
        const toggleSubMenu = () => setSubMenuOpen((prev) => !prev);

        useEffect(() => {
            if (activeLinkPath?.includes(url)) setSubMenuOpen(true);
        }, [activeLinkPath, url]);
        return (
            <Box position="relative" minW="160px">
                {/* If there is no submenu  */}
                {!subMenu ? (
                    <Link href={url ? url : '#'}>
                        <Button
                            width="100%"
                            variant="ghost"
                            fontSize="0.825rem"
                            padding="0 10px"
                            justifyContent="flex-start"
                            alignItems="center"
                            gap={4}
                            borderColor="red.100"
                            borderWidth={activeLinkPath === url ? 1 : 0}
                            bgColor={activeLinkPath === url ? 'red.50' : ''}
                            color={
                                activeLinkPath === url ? 'red.600' : 'gray.800'
                            }
                            _dark={{
                                border: 'none',
                                bg: activeLinkPath === url ? 'gray.800' : '',
                                fontWeight: 800,
                            }}
                        >
                            {Icon && (
                                <Icon size={18} style={{ width: '1.1rem' }} />
                            )}
                            <Text fontWeight={500}>{title}</Text>
                        </Button>
                    </Link>
                ) : (
                    <Button
                        onClick={() => toggleSubMenu()}
                        width="100%"
                        variant="ghost"
                        padding="0 10px"
                        justifyContent="flex-start"
                        alignItems="center"
                        gap={4}
                        fontSize="0.825rem"
                        borderWidth={activeLinkPath?.includes(url) ? 1 : 0}
                        borderColor="red.100"
                        bg={activeLinkPath?.includes(url) ? 'blue.50' : ''}
                        color={
                            activeLinkPath?.includes(url)
                                ? 'red.600'
                                : 'gray.800'
                        }
                        _dark={{
                            border: 'none',
                            bg: activeLinkPath?.includes(url) ? 'gray.800' : '',
                            fontWeight: 800,
                        }}
                    >
                        {Icon && <Icon style={{ width: '1.1rem' }} />}
                        <Text fontWeight={500}>{title}</Text>
                        <ChevronDown
                            style={{
                                height: '15px',
                                width: '15px',
                                transition: 'transform 0.2s',
                                position: 'absolute',
                                right: 2,
                            }}
                            // transition/rotate 用 Chakra props
                            // transition="transform 0.2s"
                            transform={
                                subMenuOpen ? 'rotate(180deg)' : undefined
                            }
                            // position="absolute"
                            // ={2}
                        />
                    </Button>
                )}
                {/* Submenu  */}
                {subMenu && (
                    <Box
                        display="flex"
                        flexDirection="column"
                        transition="all 0.2s linear"
                        overflow="hidden"
                        maxH={subMenuOpen ? '24rem' : 0}
                    >
                        {subMenu.map((item, index) => {
                            return (
                                <Link key={index} href={url + item.url}>
                                    <Button
                                        variant="ghost"
                                        width="100%"
                                        padding="0 10px"
                                        textAlign="left"
                                        overflow="hidden"
                                        justifyContent="flex-start"
                                        alignItems="center"
                                        gap={4}
                                        fontSize="0.8rem"
                                        color={
                                            activeLinkPath?.includes(
                                                url + item.url
                                            )
                                                ? 'primary.600'
                                                : ''
                                        }
                                    >
                                        <Dot style={{ width: '5px' }} />
                                        <Text
                                            fontWeight={500}
                                            textOverflow="ellipsis"
                                        >
                                            {item.title}
                                        </Text>
                                    </Button>
                                </Link>
                            );
                        })}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box
            borderRightWidth={1}
            p={2}
            // rounded="md"
            bg="white"
            _dark={{
                bg: 'transparent',
            }}
            borderWidth={1}
            borderTopWidth={0}
            className="text-sm min-w-[250px] overflow-y-auto overflow-x-hidden"
        >
            <Wrap alignItems="center" gap={3}>
                <Image src="/logo.svg" height={11} />
            </Wrap>
            <br />
            {navTree.map((nav, index) => (
                <div key={index} className="">
                    <SidebarItem
                        url={nav.url}
                        title={nav.title}
                        icon={nav.icon}
                        subMenu={nav.subMenu}
                    />
                </div>
            ))}
        </Box>
    );
};

export default memo(Sidebar);
