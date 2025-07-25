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
import { Item } from 'node_modules/@chakra-ui/react/dist/types/components/accordion/namespace';

// 订单状态映射
const ORDER_STATUS_MAP = {
    PAID: '待审核',
    CHECKED: '待发货',
    DELIVERED: '待收货',
    COMPLETED: '交易完成',
    CANCELLED: '交易取消',
} as const;

type OrderStatus = keyof typeof ORDER_STATUS_MAP;

export default function OrderDetailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showSuccessToast, showErrorToast } = useCustomToast();
    const orderId = searchParams.get('orderId');

    // 获取订单数据
    const { data: order, refetch } = api.order.get.useQuery({
        id: orderId,
    });

    // 确认收货 mutation
    const confirmReceived = api.order.confirmReceived.useMutation({
        onSuccess: () => {
            showSuccessToast('确认收货成功');
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 确认收货对话框
    const { ConfirmDialog: ConfirmReceivedDialog, open: openConfirmReceived } =
        useConfirmDialog({
            title: '确认收货',
            content: '确定已收到商品吗？确认后订单将变为已完成状态。',
            confirmText: '确认收货',
            cancelText: '取消',
            buttonProps: { style: { display: 'none' } },
            onConfirm: async () => {
                if (orderId) {
                    await confirmReceived.mutateAsync({ id: orderId });
                }
            },
        });

    // 处理确认收货
    const handleConfirmReceived = () => {
        openConfirmReceived();
    };

    const defaultAddress = order?.address || {};

    // 获取订单状态对应的中文名称
    const getOrderStatusTitle = (status: string) => {
        return ORDER_STATUS_MAP[status as OrderStatus] || '订单详情';
    };

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="100px">
            <TopNav
                title={
                    order?.status
                        ? getOrderStatusTitle(order.status)
                        : '订单详情'
                }
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
                ({ product, spec, quantity, remark, specInfo, logiPrice }) => (
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
                                {remark || '无'}
                            </Text>
                        </Flex>

                        {/* 价格明细 */}
                        <VStack align="stretch" gap={2}>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">运费</Text>
                                <Text color="red.600">
                                    ¥{logiPrice.toFixed(2)}
                                </Text>
                            </Flex>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">商品总价</Text>
                                <Text ml={2} color="red.500">
                                    ¥
                                    {(order.totalPrice - logiPrice)?.toFixed(2)}
                                </Text>
                            </Flex>
                            <Flex justify="space-between" my={2}>
                                <Text color="gray.600">实付</Text>
                                <Text color="red.600">
                                    ¥{order.totalPrice.toFixed(2)}
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

            {/* 待收货状态显示快递单号和确认收货按钮 */}
            {order?.status === 'DELIVERED' && (
                <Box bg="white" borderRadius="xs" m={2} p={4}>
                    {/* 快递单号 */}
                    {order.trackingNumber && (
                        <Flex justify="space-between" align="center" mb={4}>
                            <Text color="gray.600" fontWeight="medium">
                                快递单号
                            </Text>
                            <Text color="blue.600" fontWeight="medium">
                                {order.trackingNumber}
                            </Text>
                        </Flex>
                    )}

                    {/* 确认收货按钮 */}
                </Box>
            )}
            <Box
                position="fixed"
                left={0}
                right={0}
                bottom={0}
                bg="transparent"
                zIndex={10}
                p={4}
            >
                <Button
                    w="100%"
                    borderRadius="md"
                    bg="#fa2222"
                    color="#fff"
                    size="xl"
                    colorScheme="blue"
                    variant="solid"
                    onClick={handleConfirmReceived}
                    loading={confirmReceived.isPending}
                >
                    确认收货
                </Button>
            </Box>
            {/* 确认收货对话框 */}
            {ConfirmReceivedDialog}
        </Box>
    );
}
