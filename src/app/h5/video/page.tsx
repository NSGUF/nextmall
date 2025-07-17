"use client";

import { useState } from "react";
import { Box, Flex, Text, Image, Badge, SimpleGrid } from "@chakra-ui/react";
import { useRouter } from "next/navigation";

// 分类Tab
const tabs = [
    { key: "all", label: "全部" },
    { key: "movie", label: "电影" },
    { key: "tv", label: "电视剧" },
    { key: "doc", label: "纪录片" },
    { key: "variety", label: "综艺" },
    { key: "variety", label: "综艺" },
    { key: "variety", label: "综艺" },
    { key: "variety", label: "综艺" },
    { key: "variety", label: "综艺" },
];

// 视频类型
interface VideoItem {
    id: number;
    cover: string;
    title: string;
    subtitle: string;
    badge: string;
    playCount: string;
    score: number;
}

// 假数据，按分类分组
const videoData: { [key: string]: VideoItem[] } = {
    all: [
        {
            id: 1,
            cover: "/image.png",
            title: "说唱新世代",
            subtitle: "万物皆可说唱",
            badge: "出品",
            playCount: "9.5亿",
            score: 9.6,
        },
        {
            id: 2,
            cover: "/image.png",
            title: "风犬少年的天空",
            subtitle: "彭昱畅喊你来追剧",
            badge: "出品",
            playCount: "9亿",
            score: 8.1,
        },
        {
            id: 3,
            cover: "/image.png",
            title: "三国演义",
            subtitle: "正所谓乱世出英雄",
            badge: "会员",
            playCount: "7.2亿",
            score: 9.9,
        },
        {
            id: 4,
            cover: "/image.png",
            title: "三悦有了新工作",
            subtitle: "废柴95后打工日记",
            badge: "出品",
            playCount: "6.9亿",
            score: 9.2,
        },
        {
            id: 5,
            cover: "/image.png",
            title: "守护解放西3",
            subtitle: "星城守卫者",
            badge: "出品",
            playCount: "4.7亿",
            score: 9.8,
        },
        {
            id: 6,
            cover: "/image.png",
            title: "超级变变变",
            subtitle: "创意竞赛！千掉无聊",
            badge: "独播",
            playCount: "4.5亿",
            score: 9.6,
        },
        {
            id: 7,
            cover: "/image.png",
            title: "奇妙博物馆",
            subtitle: "AMAZING MUSEUM",
            badge: "",
            playCount: "4.3亿",
            score: 7.8,
        },
        {
            id: 8,
            cover: "/image.png",
            title: "赛跑吧大学生",
            subtitle: "在一起更美妙",
            badge: "出品",
            playCount: "4.1亿",
            score: 9.6,
        },
        {
            id: 9,
            cover: "/image.png",
            title: "守护不打烊",
            subtitle: "",
            badge: "出品",
            playCount: "4.1亿",
            score: 9.6,
        },
    ],
    movie: [],
    tv: [],
    doc: [],
    variety: [],
};

export default function VideoPage() {
    const [activeTab, setActiveTab] = useState("all");
    const router = useRouter();
    const videos = videoData[activeTab] ?? [];

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
                // sx removed, use style instead
                style={{
                    scrollbarWidth: "none", // Firefox
                    msOverflowStyle: "none", // IE 10+
                }}
                className="hide-scrollbar"
            >
                <style jsx global>{`
                    .hide-scrollbar {
                        scrollbar-width: none; /* Firefox */
                        -ms-overflow-style: none; /* IE 10+ */
                    }
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none; /* Chrome/Safari/Webkit */
                    }
                `}</style>
                <Flex gap={2} minW="max-content">
                    {tabs.map((tab) => (
                        <Box
                            key={tab.key}
                            px={2}
                            py={0}
                            fontWeight={activeTab === tab.key ? "bold" : "normal"}
                            color={activeTab === tab.key ? "red.500" : "gray.600"}
                            fontSize="md"
                            borderBottom={activeTab === tab.key ? "2px solid #ef4444" : "2px solid transparent"}
                            cursor="pointer"
                            onClick={() => setActiveTab(tab.key)}
                            display="inline-block"
                            whiteSpace="nowrap"
                        >
                            {tab.label}
                        </Box>
                    ))}
                </Flex>
            </Box>
            {/* 视频宫格 */}
            <Box px={4} py={4}>
                <SimpleGrid columns={2} gap={4}>
                    {videos.map((video: VideoItem) => (
                        <Box
                            key={video.id}
                            bg="white"
                            borderRadius="xl"
                            boxShadow="xs"
                            overflow="hidden"
                            cursor="pointer"
                            position="relative"
                            onClick={() => router.push(`/h5/video/${video.id}`)}
                            _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}
                            transition="all 0.2s"
                        >
                            {/* 封面图和角标 */}
                            <Box position="relative">
                                <Image
                                    src={video.cover}
                                    alt={video.title}
                                    w="100%"
                                    h="120px"
                                    objectFit="cover"
                                    loading="lazy"
                                />
                                {video.badge && (
                                    <Badge
                                        position="absolute"
                                        top={2}
                                        left={2}
                                        colorPalette={video.badge === "会员" ? "pink" : video.badge === "独播" ? "yellow" : "blue"}
                                        borderRadius="md"
                                        px={2}
                                        py={0.5}
                                        fontSize="xs"
                                    >
                                        {video.badge}
                                    </Badge>
                                )}
                            </Box>
                            {/* 标题和副标题 */}
                            <Box px={2} pb={2} mt={1}>
                                <Text fontWeight="bold" fontSize="sm" truncate>{video.title}</Text>
                                <Text fontSize="xs" color="gray.500">{video.playCount}次播放 | {"时长"}</Text>
                            </Box>
                        </Box>
                    ))}
                </SimpleGrid>
                {videos.length === 0 && (
                    <Flex justify="center" align="center" h="200px" color="gray.400" fontSize="lg">
                        暂无内容
                    </Flex>
                )}
            </Box>
        </Box>
    );
} 