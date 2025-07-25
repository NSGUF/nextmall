'use client';

import {
    Box,
    Flex,
    Text,
    IconButton,
    AspectRatio,
    VStack,
    HStack,
    Button,
    Badge,
    Separator,
    Avatar,
} from '@chakra-ui/react';
import { FiChevronLeft, FiHeart, FiShare2, FiPlay } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { ContentLoading } from '@/app/_components/LoadingSpinner';
import { formatDuration } from '@/app/utils/formatDuration';
import { useState } from 'react';
import TabBar from '../../../h5/_components/TabBar';
import TopNav from '../../_components/TopNav';

export default function VideoDetailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const courseId = searchParams.get('id');
    const [isPlaying, setIsPlaying] = useState(false);

    // 获取课程详情
    const { data: course, isLoading } = api.course.get.useQuery(
        { id: courseId },
        { enabled: !!courseId }
    );

    if (!courseId) {
        return (
            <Flex
                justify="center"
                align="center"
                h="calc(100vh - 64px)"
                color="gray.400"
                fontSize="lg"
            >
                课程ID不存在
            </Flex>
        );
    }

    if (isLoading) {
        return <ContentLoading text="课程详情加载中..." />;
    }

    if (!course) {
        return (
            <Flex
                justify="center"
                align="center"
                h="calc(100vh - 64px)"
                color="gray.400"
                fontSize="lg"
            >
                课程不存在
            </Flex>
        );
    }

    const handleBack = () => {
        router.back();
    };

    const handlePlay = () => {
        setIsPlaying(true);
    };

    const handleShare = async () => {
        // 分享功能
        try {
            if (navigator.share) {
                await navigator.share({
                    title: course.title,
                    text: course.description,
                    url: window.location.href,
                });
            } else {
                // 复制链接到剪贴板
                await navigator.clipboard.writeText(window.location.href);
                alert('链接已复制到剪贴板');
            }
        } catch (error) {
            console.error('分享失败:', error);
        }
    };

    return (
        <Box minH="100vh" bg="gray.50" pb="80px">
            {/* 顶部导航栏 */}
            <TopNav title={course.title} />

            {/* 视频播放区域 */}
            <Box position="relative">
                <video
                    src={course.videoUrl}
                    controls
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            </Box>

            {/* 课程信息 */}
            <VStack align="stretch" gap={2} p={4}>
                {/* 标题和基本信息 */}
                <VStack align="stretch" boxShadow="2xs" gap={2}>
                    <Text fontSize="md" fontWeight="bold">
                        {course.title}
                    </Text>

                    <HStack gap={2} color="gray.500" fontSize="xs">
                        <Text>
                            {new Date(course.createdAt).toLocaleString()}
                        </Text>
                        <HStack gap={1}>
                            <Text>{formatDuration(course.duration)}</Text>
                        </HStack>
                        <HStack gap={1}>
                            <Text>{course.views} 次播放</Text>
                        </HStack>
                    </HStack>
                </VStack>
                <Separator />

                {/* 课程描述 */}
                <VStack align="stretch" gap={1}>
                    <Text fontWeight="medium">课程介绍</Text>
                    <Text fontSize="xs" color="gray.700">
                        {course.description}
                    </Text>
                </VStack>
            </VStack>
        </Box>
    );
}
