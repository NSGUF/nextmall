"use client";
import { useState } from "react";
import { Box, Flex, Text, VStack, Image, Input } from "@chakra-ui/react";
import { InputGroup } from "@/app/_components/ui";
import { FiSearch, FiThumbsUp, FiClock, FiZap, FiGift, FiCheckSquare, FiUsers, FiTrendingUp, FiStar, FiShoppingBag, FiDollarSign } from "react-icons/fi";
import { api } from "@/trpc/react";

export default function CategoryPage() {
    const { data: categories = [] } = api.category.list.useQuery();
    const [activeIndex, setActiveIndex] = useState(0);
    const activeCategory = categories[activeIndex];
    const { data: products = [] } = api.product.list.useQuery(activeCategory ? { categoryId: activeCategory.id } : undefined);

    return (
        <Flex h="calc(100vh - 64px)" flexDirection="column" overflow="hidden">
            {/* 顶部搜索栏 */}
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
            {/* 内容区，占满剩余空间 */}
            <Flex flex={1} bg="gray.50" h="0" mt={4} minH={0} overflow="hidden">
                {/* 左侧分类列表 */}
                <VStack
                    as="nav"
                    align="stretch"
                    gap={0}
                    w="100px"
                    h="100%"
                    bg="white"
                    overflowY="auto"
                    borderRight="1px solid #eee"
                    flexShrink={0}
                >
                    {categories.map((cat, idx) => (
                        <Box
                            key={cat.id}
                            px={3}
                            py={4}
                            cursor="pointer"
                            bg={activeIndex === idx ? "gray.100" : "white"}
                            color={activeIndex === idx ? "red.500" : "gray.800"}
                            fontWeight={activeIndex === idx ? "bold" : "normal"}
                            borderLeft={activeIndex === idx ? "3px solid #f00" : "3px solid transparent"}
                            transition="all 0.2s"
                            onClick={() => setActiveIndex(idx)}
                            _hover={{ bg: "gray.50" }}
                            textAlign="center"
                            fontSize="sm"
                        >
                            {cat.name}
                        </Box>
                    ))}
                </VStack>

                {/* 右侧内容区 */}
                <Box flex={1} h="100%" overflowY="auto" p={4} minW={0}>
                    <Text fontSize="md" fontWeight="bold" mb={4}>
                        {activeCategory ? activeCategory.name : ""}分类
                    </Text>
                    <Flex wrap="wrap" gap={3}>
                        {products.map((item) => (
                            <Box
                                key={item.id}
                                w="90px"
                                textAlign="center"
                                bg="white"
                                borderRadius="xs"
                                boxShadow="1sx"
                                p={2}
                                _hover={{ boxShadow: "md" }}
                            >
                                <Image
                                    src={item.images?.[0] ?? "/logo.svg"}
                                    alt={item.title}
                                    w="70px"
                                    h="70px"
                                    mx="auto"
                                    mb={2}
                                    borderRadius="md"
                                    objectFit="cover"
                                    bg="gray.100"
                                />
                                <Text fontSize="xs" color="gray.700">
                                    {item.title}
                                </Text>
                            </Box>
                        ))}
                    </Flex>
                </Box>
            </Flex>
        </Flex>
    );
} 