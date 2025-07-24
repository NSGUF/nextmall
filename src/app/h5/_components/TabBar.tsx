'use client';

import { Box, Flex } from '@chakra-ui/react';

interface Tab {
    id: string;
    title: string;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
}

export default function TabBar({
    tabs,
    activeTabId,
    onTabChange,
}: TabBarProps) {
    return (
        <Box
            px={6}
            py={2}
            bg="white"
            boxShadow="2xs"
            position="sticky"
            top={0}
            zIndex={10}
            overflowX="auto"
            whiteSpace="nowrap"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            className="hide-scrollbar"
        >
            <style jsx global>{`
                .hide-scrollbar {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <Flex gap={2} minW="max-content">
                {tabs.map((tab) => (
                    <Box
                        key={tab.id}
                        px={2}
                        py={0}
                        fontWeight={activeTabId === tab.id ? 'bold' : 'normal'}
                        color={activeTabId === tab.id ? 'red.500' : 'gray.600'}
                        fontSize="md"
                        borderBottom={
                            activeTabId === tab.id
                                ? '2px solid #ef4444'
                                : '2px solid transparent'
                        }
                        cursor="pointer"
                        onClick={() => onTabChange(tab.id)}
                        display="inline-block"
                        whiteSpace="nowrap"
                    >
                        {tab.title}
                    </Box>
                ))}
            </Flex>
        </Box>
    );
}
