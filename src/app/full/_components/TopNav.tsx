import React from 'react';
import { FiChevronLeft } from 'react-icons/fi';
import { Text, IconButton, Flex } from '@chakra-ui/react';

export default function TopNav({
    title = '收货地址',
    onBack,
}: {
    title?: string;
    onBack?: () => void;
}) {
    const handleBack = onBack ?? (() => window.history.back());
    return (
        <Flex
            align="center"
            position="relative"
            w="100%"
            h="48px"
            bgColor="#f8f8f8"
        >
            <IconButton
                aria-label="Call support"
                onClick={handleBack}
                variant="ghost"
                color="gray.800"
                position="absolute"
                left={0}
                top="50%"
                transform="translateY(-50%)"
            >
                <FiChevronLeft
                    strokeWidth={1.2}
                    style={{ width: 30, height: 30 }}
                />
            </IconButton>
            <Text
                fontSize="md"
                mx="auto"
                textAlign="center"
                w="80vw"
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                pointerEvents="none"
            >
                {title}
            </Text>
        </Flex>
    );
}
