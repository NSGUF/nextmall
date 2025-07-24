'use client';

import { Box, Flex, Input, Text } from '@chakra-ui/react';
import { InputGroup } from '@/app/_components/ui';
import { FiSearch, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import TabBar from '@/app/h5/_components/TabBar';
import ProductList from '@/app/h5/_components/ProductList';

export default function SearchPage() {
    const router = useRouter();
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeTabId, setActiveTabId] = useState('all');

    // 搜索商品
    const { data: products = [], isLoading: productsLoading } =
        api.product.list.useQuery(
            searchKeyword.trim()
                ? {
                      search: searchKeyword.trim(),
                      orderBy:
                          activeTabId === 'sales'
                              ? 'sales'
                              : activeTabId === 'price_asc'
                                ? 'price_asc'
                                : activeTabId === 'price_desc'
                                  ? 'price_desc'
                                  : undefined,
                  }
                : undefined,
            {
                enabled: !!searchKeyword.trim() && hasSearched,
            }
        );

    // 搜索历史管理
    useEffect(() => {
        const history = localStorage.getItem('search_history');
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    const saveSearchHistory = (keyword: string) => {
        if (!keyword.trim()) return;

        const newHistory = [
            keyword,
            ...searchHistory.filter((item) => item !== keyword),
        ].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
    };

    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('search_history');
    };

    const handleSearch = () => {
        if (!searchKeyword.trim()) return;

        saveSearchHistory(searchKeyword.trim());
        setHasSearched(true);
    };

    const handleHistoryClick = (keyword: string) => {
        setSearchKeyword(keyword);
        setHasSearched(true);
    };

    const tabs = [
        { id: 'all', title: '综合' },
        { id: 'sales', title: '销量' },
        { id: 'price_asc', title: '价格升序' },
        { id: 'price_desc', title: '价格降序' },
    ];

    return (
        <Box bg="gray.50" minH="100vh">
            {/* 顶部搜索栏 */}
            <Box bg="white" px={4} py={3} boxShadow="xs">
                <Flex align="center" gap={3}>
                    <FiArrowLeft
                        size={20}
                        color="#666"
                        cursor="pointer"
                        onClick={() => router.back()}
                    />
                    <InputGroup
                        flex={1}
                        startOffset="0px"
                        startElement={<FiSearch color="#bbb" size={16} />}
                    >
                        <Input
                            size="sm"
                            placeholder="搜索商品"
                            variant="outline"
                            bg="gray.100"
                            borderRadius="full"
                            border="none"
                            _focus={{ bg: 'gray.100', border: 'none' }}
                            _placeholder={{ color: 'gray.400' }}
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            onKeyPress={(e) =>
                                e.key === 'Enter' && handleSearch()
                            }
                        />
                    </InputGroup>
                    <Text
                        color="red.500"
                        fontSize="sm"
                        cursor="pointer"
                        onClick={handleSearch}
                        fontWeight="medium"
                    >
                        搜索
                    </Text>
                </Flex>
            </Box>

            {/* 搜索结果 */}
            {hasSearched && searchKeyword.trim() ? (
                <Box>
                    {/* TabBar */}
                    <TabBar
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onTabChange={setActiveTabId}
                        size="sm"
                    />

                    {/* 商品列表 */}
                    <ProductList
                        products={products}
                        isLoading={productsLoading}
                        emptyText="暂无更多数据"
                    />
                </Box>
            ) : (
                /* 搜索历史 */
                <Box px={4} py={4}>
                    <Flex align="center" justify="space-between" mb={4}>
                        <Text
                            fontSize="md"
                            fontWeight="medium"
                            color="gray.700"
                        >
                            历史搜索
                        </Text>
                        {searchHistory.length > 0 && (
                            <FiTrash2
                                size={16}
                                color="#999"
                                cursor="pointer"
                                onClick={clearSearchHistory}
                            />
                        )}
                    </Flex>

                    {searchHistory.length > 0 ? (
                        <Flex wrap="wrap" gap={2}>
                            {searchHistory.map((keyword, index) => (
                                <Box
                                    key={index}
                                    px={3}
                                    py={2}
                                    bg="white"
                                    borderRadius="full"
                                    fontSize="sm"
                                    color="gray.600"
                                    cursor="pointer"
                                    onClick={() => handleHistoryClick(keyword)}
                                    _hover={{ bg: 'gray.100' }}
                                >
                                    {keyword}
                                </Box>
                            ))}
                        </Flex>
                    ) : (
                        <Text color="gray.400" textAlign="center" py={8}>
                            暂无搜索历史~
                        </Text>
                    )}
                </Box>
            )}
        </Box>
    );
}
