'use client';

import React, { Suspense, useState } from 'react';
import Sidebar from '@/app/admin/_components/Sidebar';
import Header from '@/app/admin/_components/Header';
import { Box, Spinner, Flex } from '@chakra-ui/react';
import { Toaster } from '@/app/_components/ui/toaster';
import AdminGuard from '@/app/_components/AdminGuard';
import { ROLES } from '@/app/const/status';
import { SidebarContext } from '@/app/admin/_components/SidebarContext';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <AdminGuard allowedRoles={[ROLES.SUPERADMIN]}>
            <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
                <Flex
                    h="100vh"
                    w="100vw"
                    overflow="hidden"
                    flexDirection={{ base: 'column', md: 'row' }}
                    position="relative"
                >
                    <Sidebar />
                    <Toaster />
                    {/* 手机端关闭导航的背景遮罩 */}
                    {sidebarOpen && (
                        <Box
                            display={{ base: 'block', md: 'none' }}
                            position="absolute"
                            top={54}
                            left={0}
                            right={0}
                            bottom={0}
                            zIndex={5}
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                    <Box
                        bgColor="gray.50"
                        _dark={{ bgColor: 'transparent' }}
                        h="full"
                        w="full"
                        minW={{ base: 'auto', md: '800px' }}
                        overflow="hidden"
                        display="flex"
                        flexDirection="column"
                    >
                        <Header />
                        <Box overflow="auto" flex="1" w="full" p={3}>
                            <Suspense
                                fallback={
                                    <Flex
                                        h="full"
                                        w="full"
                                        align="center"
                                        justify="center"
                                    >
                                        <Spinner />
                                    </Flex>
                                }
                            >
                                {children}
                            </Suspense>
                        </Box>
                    </Box>
                </Flex>
            </SidebarContext.Provider>
        </AdminGuard>
    );
}
