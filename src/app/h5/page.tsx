"use client";

import { Box, Flex, Input, SimpleGrid, Text, Image } from "@chakra-ui/react";
import { InputGroup } from "@/app/_components/ui";
import { FiSearch } from "react-icons/fi";
import BannerCarousel from "./_components/BannerCarousel";
import { api } from "@/trpc/react";
import Link from "next/link";

export default function H5Home() {
    // 获取 isActive 的 banners
    const { data: banners = [] } = api.banner.list.useQuery({ isActive: true });
    const { data: category = [] } = api.category.list.useQuery();
    const { data: products = [] } = api.product.list.useQuery({
        orderBy: 'sales'
    });

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
                <SimpleGrid columns={4} rowGap={4} bg="white" borderRadius="xl" py={4} shadow="md">
                    {category.map((entry) => (
                        <Link href={`/h5/category?id=${entry.id}`} key={entry.name} >
                            <Flex direction="column" align="center" justify="center">
                                <Image src={entry.icon} height={11} alt={entry.description} />
                                <Text fontSize="xs" color="gray.700" truncate>{entry.name}</Text>
                            </Flex>
                        </Link>
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
                    {products.map((item) => (
                        <Link href={`/full/product?id=${item.id}`} key={item.id}>
                            <Box bg="white" borderRadius="sm" boxShadow="2xs" p={2} display="flex" flexDirection="column" alignItems="center">
                                <Box w="100%" h="140px" mb={2} borderRadius="md" overflow="hidden" bg="#f7f7f7" position="relative">
                                    <Image src={item.images?.[0]} alt={item.title} w="100%" h="100%" objectFit="cover" position="absolute" top={0} left={0} />
                                </Box>
                                <Text fontSize="md" py={2} color="gray.800" fontWeight="medium" truncate w="100%" textAlign="left" title={item.title}>
                                    {item.title}
                                </Text>
                                <Flex w="100%" align="center" justify="space-between">
                                    <Text fontSize="sm" color="red.500" fontWeight="bold" textAlign="left">
                                        <Text as="span" fontSize="md" color="red.400" verticalAlign="baseline">￥</Text>
                                        {item.specs[0]?.price.toFixed(2)}
                                    </Text>
                                    <Text fontSize="2xs" fontWeight="normal" color="gray.500">已售{item.sales}件</Text>
                                </Flex>
                            </Box>
                        </Link>
                    ))}
                </SimpleGrid>
            </Box>
        </Box>
    );
} 