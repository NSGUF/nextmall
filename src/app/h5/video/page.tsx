'use client';

import { useState } from 'react';
import { Box, Flex, Text, Image, Badge, SimpleGrid } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';

export default function VideoPage() {
    // 获取所有合集
    const { data: collections = [] } = api.collection.list.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 0,
        gcTime: 0,
    });
    // 当前选中的合集ID，"all" 表示全部
    const [activeCollectionId, setActiveCollectionId] = useState<string>('all');
    // 获取课程，按合集过滤
    const { data: courses = [] } = api.course.list.useQuery(
        activeCollectionId !== 'all'
            ? { collectionId: activeCollectionId }
            : undefined
    );
    const router = useRouter();

    // 合集tab数据，最前面加一个“全部”
    const tabs = [{ id: 'all', title: '全部' }, ...collections];

    return (
        <Box minH="100vh" bg="gray.50">
            {/* 顶部Tab栏 */}
            <Box
                px={2}
                py={2}
                bg="white"
                boxShadow="sm"
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
                            fontWeight={
                                activeCollectionId === tab.id
                                    ? 'bold'
                                    : 'normal'
                            }
                            color={
                                activeCollectionId === tab.id
                                    ? 'red.500'
                                    : 'gray.600'
                            }
                            fontSize="md"
                            borderBottom={
                                activeCollectionId === tab.id
                                    ? '2px solid #ef4444'
                                    : '2px solid transparent'
                            }
                            cursor="pointer"
                            onClick={() => setActiveCollectionId(tab.id)}
                            display="inline-block"
                            whiteSpace="nowrap"
                        >
                            {tab.title}
                        </Box>
                    ))}
                </Flex>
            </Box>
            {/* 视频宫格 */}
            <Box px={4} py={4}>
                <SimpleGrid columns={2} gap={4}>
                    {courses.map((course: any) => (
                        <Box
                            key={course.id}
                            bg="white"
                            borderRadius="sm"
                            boxShadow="2xs"
                            overflow="hidden"
                            cursor="pointer"
                            position="relative"
                            onClick={() =>
                                router.push(`/h5/video/${course.id}`)
                            }
                            _hover={{
                                boxShadow: 'md',
                                transform: 'translateY(-2px)',
                            }}
                            transition="all 0.2s"
                        >
                            {/* 封面图和角标 */}
                            <Box position="relative">
                                <Image
                                    src={course.coverImage ?? '/image.png'}
                                    alt={course.title}
                                    w="100%"
                                    h="120px"
                                    objectFit="cover"
                                    loading="lazy"
                                />
                                {course.isFree === false && (
                                    <Badge
                                        position="absolute"
                                        top={2}
                                        left={2}
                                        colorScheme="yellow"
                                        borderRadius="md"
                                        px={2}
                                        py={0.5}
                                        fontSize="xs"
                                    >
                                        付费
                                    </Badge>
                                )}
                            </Box>
                            {/* 标题和副标题 */}
                            <Box px={2} pb={2} mt={1}>
                                <Text fontWeight="bold" fontSize="sm" truncate>
                                    {course.title}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {course.views}次播放 | {course.duration}秒
                                </Text>
                            </Box>
                        </Box>
                    ))}
                </SimpleGrid>
                {courses.length === 0 && (
                    <Flex
                        justify="center"
                        align="center"
                        h="200px"
                        color="gray.400"
                        fontSize="lg"
                    >
                        暂无内容
                    </Flex>
                )}
            </Box>
        </Box>
    );
}
