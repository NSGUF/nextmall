'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Spinner, Flex, Text, Button } from '@chakra-ui/react';
import { FiShield } from 'react-icons/fi';
import { ROLES, ROLES_TEXT } from '../const/status';

interface AdminGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function AdminGuard({
    children,
    allowedRoles = [ROLES.SUPERADMIN, ROLES.VENDOR],
}: AdminGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'loading') return; // 还在加载中

        if (!session) {
            // 未登录，跳转到登录页
            router.replace('/login');
            return;
        }

        // const userRole = session.user?.role;
        // if (!userRole || !allowedRoles.includes(userRole)) {
        //     // 没有权限，跳转到首页
        //     router.replace('/');
        //     return;
        // }
    }, [session, status, router, allowedRoles]);

    // 加载中
    if (status === 'loading') {
        return (
            <Flex
                h="100vh"
                w="100vw"
                align="center"
                justify="center"
                bg="gray.50"
                _dark={{ bg: 'gray.900' }}
            >
                <Flex direction="column" align="center" gap={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                        正在验证权限...
                    </Text>
                </Flex>
            </Flex>
        );
    }

    // 未登录
    if (!session) {
        return (
            <Flex
                h="100vh"
                w="100vw"
                align="center"
                justify="center"
                bg="gray.50"
                _dark={{ bg: 'gray.900' }}
            >
                <Flex direction="column" align="center" gap={4}>
                    <FiShield size={48} color="red" />
                    <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color="gray.800"
                        _dark={{ color: 'gray.200' }}
                    >
                        请先登录
                    </Text>
                    <Text color="gray.600" _dark={{ color: 'gray.400' }}>
                        您需要登录后才能访问管理后台
                    </Text>
                    <Button
                        colorScheme="blue"
                        onClick={() => router.push('/login')}
                    >
                        前往登录
                    </Button>
                </Flex>
            </Flex>
        );
    }

    const userRole = session.user?.role;

    // 权限不足
    if (!userRole || !allowedRoles.includes(userRole)) {
        return (
            <Flex
                h="100vh"
                w="100vw"
                align="center"
                justify="center"
                bg="gray.50"
                _dark={{ bg: 'gray.900' }}
            >
                <Flex direction="column" align="center" gap={4}>
                    <FiShield size={48} color="orange" />
                    <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color="gray.800"
                        _dark={{ color: 'gray.200' }}
                    >
                        权限不足
                    </Text>
                    <Text
                        color="gray.600"
                        _dark={{ color: 'gray.400' }}
                        textAlign="center"
                    >
                        您的账户权限不足，无法访问此页面
                        <br />
                        当前角色：{ROLES_TEXT[userRole] || '未知'}
                        <br />
                        需要角色：
                        {allowedRoles
                            .map((role) => ROLES_TEXT[role])
                            .join(' 或 ')}
                    </Text>
                    <Button
                        colorScheme="blue"
                        onClick={() => {
                            // 根据用户角色跳转到对应页面
                            if (userRole === ROLES.VENDOR) {
                                router.push('/vendor');
                            } else if ([ROLES.SUPERADMIN].includes(userRole)) {
                                router.push('/admin');
                            } else {
                                router.push('/h5');
                            }
                        }}
                    >
                        返回首页
                    </Button>
                </Flex>
            </Flex>
        );
    }

    // 有权限，渲染子组件
    return <>{children}</>;
}
