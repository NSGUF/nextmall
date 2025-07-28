'use client';

import { Box, SimpleGrid, Text, Image, Flex } from '@chakra-ui/react';
import Link from 'next/link';
import { ContentLoading } from '@/app/_components/LoadingSpinner';

interface Product {
    id: string;
    title: string;
    images?: string[];
    specs: Array<{
        price: number;
    }>;
    sales: number;
}

interface ProductListProps {
    products: any;
    isLoading?: boolean;
    emptyText?: string;
}

export default function ProductList({
    products,
    isLoading = false,
    emptyText = '暂无商品',
}: ProductListProps) {
    if (isLoading) {
        return <ContentLoading text="商品加载中..." />;
    }

    if (products.length === 0) {
        return (
            <Box py={8} textAlign="center">
                <Text color="gray.400" fontSize="md">
                    {emptyText}
                </Text>
            </Box>
        );
    }

    return (
        <Box px={4} py={4}>
            <SimpleGrid columns={2} gap={2}>
                {products.map((item) => (
                    <Link href={`/full/product?id=${item.id}`} key={item.id}>
                        <Box
                            bg="white"
                            borderRadius="sm"
                            boxShadow="2xs"
                            p={2}
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            _hover={{ boxShadow: 'sm' }}
                            transition="box-shadow 0.2s"
                        >
                            <Box
                                w="100%"
                                h="140px"
                                mb={2}
                                borderRadius="md"
                                overflow="hidden"
                                bg="#f7f7f7"
                                position="relative"
                            >
                                <Image
                                    src={item.images?.[0]}
                                    alt={item.title}
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                    position="absolute"
                                    top={0}
                                    left={0}
                                />
                            </Box>
                            <Text
                                fontSize="md"
                                py={2}
                                color="gray.800"
                                fontWeight="medium"
                                truncate
                                w="100%"
                                textAlign="left"
                                title={item.title}
                            >
                                {item.title}
                            </Text>
                            <Flex
                                w="100%"
                                align="center"
                                justify="space-between"
                            >
                                <Text
                                    fontSize="sm"
                                    color="red.500"
                                    fontWeight="bold"
                                    textAlign="left"
                                >
                                    <Text
                                        as="span"
                                        fontSize="md"
                                        color="red.400"
                                        verticalAlign="baseline"
                                    >
                                        ￥
                                    </Text>
                                    {item.specs[0]?.price.toFixed(2)}
                                </Text>
                                <Text
                                    fontSize="2xs"
                                    fontWeight="normal"
                                    color="gray.500"
                                >
                                    已售{item.sales}件
                                </Text>
                            </Flex>
                        </Box>
                    </Link>
                ))}
            </SimpleGrid>
        </Box>
    );
}
