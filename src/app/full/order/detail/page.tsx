'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Box,
    Flex,
    Text,
    Image,
    Input,
    Button,
    VStack,
    HStack,
    Alert,
} from '@chakra-ui/react';
import { FiChevronRight, FiMapPin, FiCreditCard } from 'react-icons/fi';
import TopNav from '../../_components/TopNav';
import { api } from '@/trpc/react';
import useCustomToast from '@/app/hooks/useCustomToast';
import Link from 'next/link';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import {
    STORE_ADDRESS_KEY,
    STORE_GOOD_DATA_KEY,
    STORE_LAUNCH_INFO_KEY,
} from '@/app/const';

export default function OrderDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const orderId = searchParams.get('orderId');

    // 获取默认地址
    const { data: order } = api.order.get.useQuery({
        id: orderId,
    });

    const defaultAddress = order?.address || {};
    const totalLogiPrice = order?.items.reduce((acc, item) => {
        return acc + item.logiPrice;
    }, 0);
    const finalPrice = order?.totalPrice + totalLogiPrice;

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="100px">
            <TopNav
                title="订单详情"
                onBack={() => router.push('/full/order?type=paid')}
            />

            {/* 收货人信息 */}
            <Box bg="white" borderRadius="xs" m={2} px={4} pt={1} pb={4}>
                <Box mt={3}>
                    <Flex justify="space-between" fontSize="md" mb={1}>
                        <Text fontWeight="medium">{defaultAddress.name}</Text>
                        <Text color="gray.600">{defaultAddress.phone}</Text>
                    </Flex>
                    <Text color="gray.500" fontSize="sm">
                        {defaultAddress.province?.split('/')[1]}
                        {defaultAddress.city?.split('/')[1]}
                        {defaultAddress.district?.split('/')[1]}
                        {defaultAddress.detail}
                    </Text>
                </Box>
            </Box>

            {/* 商品信息 */}
            {order?.items?.map(
                ({ product, spec, quantity, remark, specInfo }, index) => (
                    <Box
                        bg="white"
                        key={product.id}
                        m={2}
                        p={4}
                        borderRadius="md"
                    >
                        <Flex gap={3}>
                            <Image
                                src={
                                    product?.images?.[0] ??
                                    spec?.image ??
                                    '/default.jpg'
                                }
                                alt={product?.title}
                                w={20}
                                h={20}
                                borderRadius="md"
                                objectFit="cover"
                            />
                            <Box flex={1} minW={0}>
                                <Text
                                    fontWeight="medium"
                                    fontSize="md"
                                    mb={1}
                                    overflow="hidden"
                                    textOverflow="ellipsis"
                                    whiteSpace="nowrap"
                                    minW={0}
                                    w="100%"
                                >
                                    {product?.title}
                                </Text>
                                <Text color="gray.400" mb={2}>
                                    {specInfo}
                                </Text>
                                <Flex align="center">
                                    <Text
                                        color="red.500"
                                        fontWeight="bold"
                                        fontSize="lg"
                                        mr={4}
                                    >
                                        ¥{spec?.price.toFixed(2)}
                                    </Text>
                                    <Text color="gray.400">x{quantity}</Text>
                                </Flex>
                            </Box>
                        </Flex>

                        {/* 配送方式 */}
                        <Flex justify="space-between" align="center" my={3}>
                            <Text color="gray.600">配送方式</Text>
                            <Flex align="center" gap={1}>
                                <Text>{product?.logistics ?? '快递发货'}</Text>
                                <FiChevronRight color="#999" size={16} />
                            </Flex>
                        </Flex>

                        {/* 订单留言 */}
                        <Flex align="center" gap={4} my={3}>
                            <Text color="gray.600">订单留言</Text>
                            <Text color="gray.400" flex="1" textAlign="right">
                                {remark}
                            </Text>
                        </Flex>

                        {/* 价格明细 */}
                        <VStack align="stretch" gap={2}>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">共{quantity}件</Text>
                                <Flex>
                                    小计:
                                    <Text ml={2} color="red.500">
                                        ¥{order.totalPrice?.toFixed(2)}
                                    </Text>
                                </Flex>
                            </Flex>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">订单运费</Text>
                                <Text color="red.600">
                                    ¥{totalLogiPrice.toFixed(2)}
                                </Text>
                            </Flex>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">实付</Text>
                                <Text color="red.600">
                                    ¥{finalPrice.toFixed(2)}
                                </Text>
                            </Flex>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">订单编号</Text>
                                <Text color="gray.600">{order?.id}</Text>
                            </Flex>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">下单时间</Text>
                                <Text color="gray.600">
                                    {order?.createdAt
                                        ? new Date(
                                              order.createdAt
                                          ).toLocaleString('zh-CN')
                                        : ''}
                                </Text>
                            </Flex>
                        </VStack>
                    </Box>
                )
            )}
        </Box>
    );
}
