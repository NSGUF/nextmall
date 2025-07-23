'use client';
import { useState } from 'react';
import {
    Box,
    Flex,
    Text,
    VStack,
    Image,
    Input,
    Button,
} from '@chakra-ui/react';
import { InputGroup } from '@/app/_components/ui';
import { FiSearch } from 'react-icons/fi';
import { api } from '@/trpc/react';
import { useSearchParams } from 'next/navigation';
import ProductItem from '@/app/h5/_components/ProductItem';

export default function CategoryPage() {
    const { data: categories = [] } = api.category.list.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 0,
        gcTime: 0,
    });
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    // 计算初始index
    const initialIndex = categories.findIndex((cat) => cat.id === id);
    const [activeIndex, setActiveIndex] = useState(
        initialIndex >= 0 ? initialIndex : 0
    );

    const activeCategory = categories[activeIndex];
    const { data: products = [] } = api.product.list.useQuery(
        activeCategory ? { categoryId: activeCategory.id } : undefined
    );

    return (
        <Flex h="calc(100vh - 64px)" flexDirection="column" overflow="hidden">
            {/* 顶部搜索栏 */}
            <Box px={4} pt={4} w="100%">
                <InputGroup
                    w="100%"
                    startOffset="0px"
                    startElement={<FiSearch color="#bbb" size={20} />}
                >
                    <Input
                        size="sm"
                        placeholder="搜索"
                        variant="outline"
                        bg="white"
                        borderRadius="full"
                        _focus={{ bg: 'white' }}
                        _placeholder={{ color: 'gray.400' }}
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
                            bg={activeIndex === idx ? 'gray.100' : 'white'}
                            color={activeIndex === idx ? 'red.500' : 'gray.800'}
                            fontWeight={activeIndex === idx ? 'bold' : 'normal'}
                            borderLeft={
                                activeIndex === idx
                                    ? '3px solid #f00'
                                    : '3px solid transparent'
                            }
                            transition="all 0.2s"
                            onClick={() => setActiveIndex(idx)}
                            _hover={{ bg: 'gray.50' }}
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
                        {activeCategory ? activeCategory.name : ''}分类
                    </Text>
                    <Flex wrap="wrap" gap={3}>
                        <ProductItem products={products} />
                    </Flex>
                </Box>
            </Flex>
        </Flex>
    );
}
