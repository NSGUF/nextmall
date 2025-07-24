'use client';

import { Box, Flex, Image, Text } from '@chakra-ui/react';
import TopNav from '@/app/full/_components/TopNav';
import { useRouter } from 'next/navigation';
import TabBar from '@/app/h5/_components/TabBar';
import { useState } from 'react';
import { api } from '@/trpc/react';
import Link from 'next/link';

export default function OrderPage() {
    const router = useRouter();
    const [activeCollectionId, setActiveCollectionId] = useState<string>('all');
    const tabs = [
        { id: 'all', title: '全部' },
        { id: 'PENDING', title: '待付款' },
        { id: 'PAID', title: '待发货' },
        { id: 'SHIPPED', title: '待收货' },
        { id: 'COMPLETED', title: '已完成' },
        { id: 'CANCELLED', title: '已取消' },
    ];
    const { data: order } = api.order.list.useQuery({});

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="100px">
            <TopNav title="订单列表" onBack={() => router.push('/h5/me')} />
            <TabBar
                tabs={tabs as any}
                activeTabId={activeCollectionId}
                onTabChange={setActiveCollectionId}
            />
            <Box h="100" overflow="auto">
                {order?.length ? (
                    order?.map((item) => (
                        <Box
                            key={item.id}
                            w="100%"
                            textAlign="center"
                            bg="white"
                            borderRadius="xs"
                            boxShadow="1sx"
                            p={4}
                            py={2}
                            _hover={{ boxShadow: 'md' }}
                        >
                            <Link
                                href={
                                    '/full/product?id=' +
                                    item.items[0].productId
                                }
                            >
                                <Flex
                                    align="center"
                                    justify="flex-start"
                                    w="100%"
                                    h="100%"
                                >
                                    <Image
                                        src={
                                            item.items[0]?.spec?.image ??
                                            '/logo.svg'
                                        }
                                        alt={item.items[0].product.title}
                                        w="80px"
                                        h="80px"
                                        borderRadius="md"
                                        objectFit="cover"
                                        bg="gray.100"
                                        mr={2}
                                    />
                                    <Flex
                                        direction="column"
                                        h="80px"
                                        flex="1"
                                        justify="space-between"
                                        minW={0}
                                    >
                                        <Text
                                            fontSize="md"
                                            textAlign="left"
                                            whiteSpace="nowrap"
                                            w="100%"
                                            fontWeight="medium"
                                            overflow="hidden"
                                            color="gray.700"
                                            textOverflow="ellipsis"
                                            minW={0}
                                        >
                                            {item.items[0].product.title}
                                        </Text>
                                        <Text
                                            fontSize="sm"
                                            color="red.500"
                                            textAlign="left"
                                            fontWeight="medium"
                                        >
                                            ￥{item.totalPrice.toFixed(2)}
                                        </Text>
                                        <Flex
                                            align="center"
                                            justify="space-between"
                                        >
                                            <Text
                                                color="gray.400"
                                                fontSize="xs"
                                                textAlign="left"
                                            >
                                                {item.items[0]?.specInfo} x{' '}
                                                {item.items?.[0]?.quantity}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Link>
                        </Box>
                    ))
                ) : (
                    <> </>
                )}
            </Box>
        </Box>
    );
}
