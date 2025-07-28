import React, { Suspense } from 'react';
import { Box, Spinner, Flex } from '@chakra-ui/react';
import { Toaster } from '@/app/_components/ui/toaster';
import AdminGuard from '@/app/_components/AdminGuard';
import Sidebar from '../admin/_components/Sidebar';
import Header from '../admin/_components/Header';
import { ROLES } from '@/app/const/status';

export default function VendorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard allowedRoles={[ROLES.VENDOR]}>
            <Flex h="100vh" w="100vw" overflow="hidden">
                <Sidebar />
                <Toaster />
                <Box
                    bgColor="gray.50"
                    _dark={{ bgColor: 'transparent' }}
                    h="full"
                    w="full"
                    minW="800px"
                    overflow="auto"
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
        </AdminGuard>
    );
}
