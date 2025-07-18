"use client";

import { Box, Flex, Input, SimpleGrid, Text, Image } from "@chakra-ui/react";
import { InputGroup } from "@/app/_components/ui";
import { FiSearch, FiThumbsUp, FiClock, FiZap, FiGift, FiCheckSquare, FiUsers, FiTrendingUp, FiStar, FiShoppingBag, FiDollarSign } from "react-icons/fi";
import BannerCarousel from "./_components/BannerCarousel";
import { api } from "@/trpc/react";


const quickEntries = [
    { icon: FiThumbsUp, label: "新品推荐" },
    { icon: FiClock, label: "限时折扣" },
    { icon: FiZap, label: "秒杀专场" },
    { icon: FiGift, label: "领券中心" },
    { icon: FiCheckSquare, label: "每日签到" },
    { icon: FiUsers, label: "优惠团购" },
    { icon: FiTrendingUp, label: "每日爆款" },
    { icon: FiStar, label: "会员中心" },
    { icon: FiShoppingBag, label: "积分商城" },
    { icon: FiDollarSign, label: "分销中心" },
];

export default function H5Home() {
    // 获取 isActive 的 banners
    const { data: banners = [], isLoading } = api.banner.list.useQuery({ isActive: true });

    return (
        <Box
            h="calc(100vh - 64px)"
            overflow="scroll"
            style={{ background: "linear-gradient(to bottom,red, #f4f4f4 50%, #f4f4f4 100%)" }}>
            {/* Search Bar */}
            <Box px={4} pt={4} w="100%">
                <InputGroup w="100%" startOffset="0px" startElement={<FiSearch color="#bbb" size={20} />}>
                    <Input
                        size="sm"
                        placeholder="搜索"
                        variant="outline"
                        bg="white"
                        borderRadius="full"
                        _focus={{ bg: "white" }}
                        _placeholder={{ color: "gray.400" }}
                    />
                </InputGroup>
            </Box>

            {/* Banner */}
            <Box px={4} mt={4}>
                <BannerCarousel banners={banners} />
            </Box>

            <Box px={4} mt={4}>
                <SimpleGrid columns={5} rowGap={4} bg="white" borderRadius="xl" py={4} shadow="md">
                    {quickEntries.map((entry) => (
                        <Flex key={entry.label} direction="column" align="center" justify="center">
                            <Box as={entry.icon} color="red.400" mb={1} boxSize="28px" />
                            <Text fontSize="xs" color="gray.700" truncate>{entry.label}</Text>
                        </Flex>
                    ))}
                </SimpleGrid>
            </Box>
            {/* 为您推荐横幅 */}
            <Flex align="center" justify="center" mt={4} mb={4} w="100%">
                <Text as="span" color="red.400" fontSize="lg" mx={1}>❤</Text>
                <Text fontWeight="medium" color="gray.700" fontSize="md">为您推荐</Text>
                <Text as="span" color="red.400" fontSize="lg" mx={1}>❤</Text>
            </Flex>

            {/* 商品推荐区块 */}
            <Box px={4} mt={2} pb={4}>
                <SimpleGrid columns={2} gap={2}>
                    {[
                        {
                            id: 1,
                            img: "/image.png",
                            title: "法式半夏花向阳花开陶瓷杯碟礼盒套装",
                            price: 38.97,
                            total: 100,
                        },
                        {
                            id: 2,
                            img: "/image.png",
                            title: "狗狗项圈圈跨境新款宠物用品",
                            price: 0.01,
                            total: 100,
                        },
                        // 可继续添加更多商品
                    ].map((item) => {
                        return (
                            <Box key={item.id} bg="white" borderRadius="sm" boxShadow="2xs" p={2} display="flex" flexDirection="column" alignItems="center">
                                <Box w="100%" h="140px" mb={2} borderRadius="md" overflow="hidden" bg="#f7f7f7" position="relative">
                                    <Image src={item.img} alt={item.title} w="100%" h="100%" objectFit="cover" position="absolute" top={0} left={0} />
                                </Box>
                                <Text fontSize="sm" py={2} color="gray.800" fontWeight="medium" truncate w="100%" textAlign="center" title={item.title}>
                                    {item.title}
                                </Text>
                                <Flex w="100%" align="center" justify="space-between">
                                    <Text fontSize="sm" color="red.500" fontWeight="bold" textAlign="left">
                                        <Text as="span" fontSize="md" color="red.400" verticalAlign="baseline">￥</Text>
                                        {item.price.toFixed(2)}
                                    </Text>
                                    <Text fontSize="2xs" fontWeight="normal" color="gray.500">已售{item.total}件</Text>
                                </Flex>
                            </Box>
                        );
                    })}
                </SimpleGrid>
            </Box>
        </Box>
    );
} 