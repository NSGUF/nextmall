'use client';

import { Box, Spinner, Text, Flex } from '@chakra-ui/react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    fullScreen?: boolean;
    color?: string;
}

export default function LoadingSpinner({
    size = 'lg',
    text = '加载中...',
    fullScreen = false,
    color = 'red.500',
}: LoadingSpinnerProps) {
    const content = (
        <Flex direction="column" align="center" justify="center" gap={3} p={8}>
            <Spinner size={size} color={color} />
            {text && (
                <Text fontSize="sm" color="gray.600" textAlign="center">
                    {text}
                </Text>
            )}
        </Flex>
    );

    if (fullScreen) {
        return (
            <Box
                position="fixed"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg="rgba(255, 255, 255, 0.8)"
                zIndex={9999}
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                {content}
            </Box>
        );
    }

    return (
        <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH="200px"
            w="100%"
        >
            {content}
        </Box>
    );
}

// 页面级别的加载组件
export function PageLoading({ text = '页面加载中...' }: { text?: string }) {
    return (
        <Box
            minH="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="gray.50"
        >
            <LoadingSpinner text={text} size="xl" />
        </Box>
    );
}

// 内容区域的加载组件
export function ContentLoading({ text = '内容加载中...' }: { text?: string }) {
    return (
        <Box
            minH="100vh"
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <LoadingSpinner text={text} size="lg" />
        </Box>
    );
}

// 按钮加载状态
export function ButtonLoading() {
    return <Spinner size="sm" color="white" />;
}
