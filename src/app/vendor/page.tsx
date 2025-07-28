'use client';

import { Box, Heading, Text } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';

export default function VendorDashboard() {
    const { data: session } = useSession();

    return (
        <Box p={6}>
            <Heading mb={4}>供应商后台</Heading>
            <Text fontSize="xl">欢迎，{session?.user?.name || '供应商'}！</Text>
            <Text fontSize="lg" mt={2} color="gray.600">
                这里是供应商专用的管理界面。
            </Text>
        </Box>
    );
}
