import React, { Suspense } from 'react';
import Sidebar from '@/app/admin/_components/Sidebar';
// TODO: Header 组件请根据你们项目实际路径调整
import Header from '@/app/admin/_components/Header';
import { Box, Spinner, Flex } from '@chakra-ui/react';
import { Toaster } from '@/app/_components/ui/toaster';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Flex h="100vh" w="100vw" overflow="hidden">
            <Sidebar />
            <Toaster />
            <Box
                bgColor="gray.50"
                _dark={{ bgColor: 'transparent' }}
                h="full"
                w="full"
                gap={3}
                display="flex"
                flexDirection="column"
            >
                <Header />
                <Box overflow="auto" h="92%" w="full" p={3}>
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
    );
}
