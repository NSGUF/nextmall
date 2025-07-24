'use client';

import { useState } from 'react';
import { Box, Flex, Text, Image, Badge, SimpleGrid } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import TabBar from '../_components/TabBar';
import { ContentLoading } from '@/app/_components/LoadingSpinner';

export default function VideoPage() {
    // 获取所有合集
    const { data: collections = [], isLoading: collectionsLoading } =
        api.collection.list.useQuery(undefined, {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
            staleTime: 1000 * 60, // 1分钟缓存
            gcTime: 1000 * 60 * 5, // 5分钟垃圾回收
        });
    // 当前选中的合集ID，"all" 表示全部
    const [activeCollectionId, setActiveCollectionId] = useState<string>('all');
    // 获取课程，按合集过滤
    const { data: courses = [], isLoading: coursesLoading } =
        api.course.list.useQuery(
            activeCollectionId !== 'all'
                ? { collectionId: activeCollectionId }
                : undefined
        );
    const router = useRouter();

    if (collectionsLoading) {
        return <ContentLoading text="视频内容加载中..." />;
    }

    // 合集tab数据，最前面加一个"全部"
    const tabs = [{ id: 'all', title: '全部' }, ...collections];

    return (
        <Box minH="100vh" bg="gray.50">
            {/* 顶部Tab栏 */}
            <TabBar
                tabs={tabs as any}
                activeTabId={activeCollectionId}
                onTabChange={setActiveCollectionId}
            />
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
