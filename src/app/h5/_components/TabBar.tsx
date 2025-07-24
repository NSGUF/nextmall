'use client';

import { Box, Flex } from '@chakra-ui/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface Tab {
    id: string;
    title: string;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
    // 新增：URL 同步选项
    urlSync?: {
        paramName: string; // URL 参数名，如 'status', 'category' 等
        defaultValue?: string; // 默认值，如果 URL 中没有参数时使用
    };
    size?: 'sm' | 'md' | 'lg';
}

export default function TabBar({
    tabs,
    activeTabId,
    onTabChange,
    urlSync,
    size = 'md',
}: TabBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // 处理 tab 切换，同时更新 URL
    const handleTabChange = (tabId: string) => {
        onTabChange(tabId);

        if (urlSync) {
            const params = new URLSearchParams(searchParams.toString());

            // 如果是默认值，移除参数；否则设置参数
            if (tabId === urlSync.defaultValue) {
                params.delete(urlSync.paramName);
            } else {
                params.set(urlSync.paramName, tabId);
            }

            // 构建新的 URL
            const newUrl = params.toString()
                ? `${pathname}?${params.toString()}`
                : pathname;

            // 更新 URL，不刷新页面
            router.replace(newUrl);
        }
    };

    // 监听 URL 变化，同步 tab 状态
    useEffect(() => {
        if (urlSync) {
            const urlParam = searchParams.get(urlSync.paramName);
            const targetTabId = urlParam || urlSync.defaultValue || tabs[0]?.id;

            // 如果 URL 中的参数与当前 activeTabId 不同，则同步
            if (targetTabId && targetTabId !== activeTabId) {
                onTabChange(targetTabId);
            }
        }
    }, [searchParams, urlSync, activeTabId, onTabChange, tabs]);
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
                        borderBottom={
                            activeTabId === tab.id
                                ? '2px solid #ef4444'
                                : '2px solid transparent'
                        }
                        cursor="pointer"
                        onClick={() => handleTabChange(tab.id)}
                        display="inline-block"
                        fontSize={size}
                        whiteSpace="nowrap"
                    >
                        {tab.title}
                    </Box>
                ))}
            </Flex>
        </Box>
    );
}
