'use client';

import {
    Box,
    Flex,
    Image,
    Text,
    Button,
    Badge,
    VStack,
    HStack,
} from '@chakra-ui/react';
import TopNav from '@/app/full/_components/TopNav';
import { useRouter, useSearchParams } from 'next/navigation';
import TabBar from '@/app/h5/_components/TabBar';
import { useState } from 'react';
import { api } from '@/trpc/react';
import Link from 'next/link';
import { ContentLoading } from '@/app/_components/LoadingSpinner';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import useCustomToast from '@/app/hooks/useCustomToast';

// 订单状态映射
const ORDER_STATUS_MAP = {
    PAID: { label: '待审核', color: 'orange' },
    CHECKED: { label: '待发货', color: 'blue' },
    DELIVERED: { label: '待收货', color: 'purple' },
    COMPLETED: { label: '已完成', color: 'green' },
    CANCELLED: { label: '已取消', color: 'red' },
} as const;

type OrderStatus = keyof typeof ORDER_STATUS_MAP;

export default function OrderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const statusFromUrl = searchParams.get('status');

    const [activeCollectionId, setActiveCollectionId] = useState<string>(
        statusFromUrl || 'all'
    );

    const tabs = [
        { id: 'all', title: '全部' },
        { id: 'PAID', title: '待审核' },
        { id: 'CHECKED', title: '待发货' },
        { id: 'DELIVERED', title: '待收货' },
        { id: 'COMPLETED', title: '已完成' },
        { id: 'CANCELLED', title: '已取消' },
    ];

    // 根据选中的标签过滤订单
    const orderStatus =
        activeCollectionId === 'all' ? undefined : (activeCollectionId as any);
    const {
        data: orderResponse,
        isLoading: orderLoading,
        refetch,
    } = api.order.list.useQuery(
        {
            status: orderStatus,
        },
        {
            refetchOnMount: 'always',
            refetchOnWindowFocus: true,
            staleTime: 1000 * 60, // 1分钟缓存
            gcTime: 1000 * 60 * 5, // 5分钟垃圾回收
        }
    );
    const order = orderResponse?.data ?? [];
    const { showSuccessToast, showErrorToast } = useCustomToast();

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
    const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
    const {
        ConfirmDialog: ConfirmReceivedDialog,
        open: openConfirmReceived,
        close: closeConfirmReceived,
    } = useConfirmDialog({
        title: '确认收货',
        content: '确定已收到商品吗？确认后订单将变为已完成状态。',
        confirmText: '确认收货',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } },
        onConfirm: async () => {
            if (confirmOrderId) {
                await confirmReceived.mutateAsync({ id: confirmOrderId });
                setConfirmOrderId(null);
            }
        },
        onCancel: () => setConfirmOrderId(null),
    });

    // 处理确认收货
    const handleConfirmReceived = (orderId: string) => {
        setConfirmOrderId(orderId);
        openConfirmReceived();
    };

    // 取消订单 mutation
    const cancelOrder = api.order.cancel.useMutation({
        onSuccess: () => {
            showSuccessToast('订单已取消');
            refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 取消订单对话框
    const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
    const { ConfirmDialog: CancelOrderDialog, open: openCancelOrder } =
        useConfirmDialog({
            title: '取消订单',
            content: '确定要取消该订单吗？',
            confirmText: '确认取消',
            cancelText: '返回',
            buttonProps: { style: { display: 'none' } },
            onConfirm: async () => {
                if (cancelOrderId) {
                    await cancelOrder.mutateAsync({ id: cancelOrderId });
                    setCancelOrderId(null);
                }
            },
            onCancel: () => setCancelOrderId(null),
        });

    // 当URL参数变化时更新选中的标签（现在由 TabBar 自动处理）
    // useEffect(() => {
    //     if (statusFromUrl) {
    //         setActiveCollectionId(statusFromUrl);
    //     }
    // }, [statusFromUrl]);

    if (orderLoading) {
        return (
            <Box bg="#f5f5f7" minH="100vh">
                <TopNav title="订单列表" onBack={() => router.push('/h5/me')} />
                <ContentLoading text="订单加载中..." />
            </Box>
        );
    }
    if (!order.length) {
        return (
            <Box bg="#f5f5f7" minH="100vh">
                <TopNav title="订单列表" onBack={() => router.push('/h5/me')} />
                <Flex
                    justify="center"
                    align="center"
                    h="calc(100vh - 64px)"
                    color="gray.400"
                    fontSize="lg"
                >
                    暂无内容
                </Flex>
            </Box>
        );
    }

    return (
        <Box bg="#f5f5f7" minH="100vh" pb="100px">
            <TopNav title="订单列表" onBack={() => router.push('/h5/me')} />
            <TabBar
                tabs={tabs as any}
                activeTabId={activeCollectionId}
                onTabChange={setActiveCollectionId}
                urlSync={{
                    paramName: 'status',
                    defaultValue: 'all',
                }}
            />
            <Box h="100" overflow="auto" p={2}>
                {order?.length ? (
                    order?.map((item) => (
                        <Box
                            key={item.id}
                            w="100%"
                            bg="white"
                            borderRadius="lg"
                            boxShadow="sm"
                            borderWidth="1px"
                            borderColor="gray.100"
                            p={3}
                            mb={3}
                        >
                            {/* 头部：订单号 + 状态 */}
                            <Flex align="center" justify="space-between" mb={2}>
                                <Text
                                    fontSize="xs"
                                    color="gray.500"
                                    fontFamily="mono"
                                >
                                    {item.id}
                                </Text>
                                <Badge
                                    colorPalette={
                                        ORDER_STATUS_MAP[
                                            item.status as OrderStatus
                                        ]?.color || 'gray'
                                    }
                                    variant="subtle"
                                    fontSize="xs"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                >
                                    {ORDER_STATUS_MAP[
                                        item.status as OrderStatus
                                    ]?.label || item.status}
                                </Badge>
                            </Flex>

                            <Box h="1px" bg="gray.100" mb={2} />

                            {/* 商品列表：点击进入详情 */}
                            <Link
                                href={'/full/order/detail?orderId=' + item.id}
                            >
                                <VStack align="stretch" gap={2} w="full">
                                    {item.items?.map((orderItem: any) => (
                                        <Flex
                                            key={orderItem.id}
                                            align="center"
                                            justify="flex-start"
                                            w="full"
                                            gap={3}
                                        >
                                            <Image
                                                src={
                                                    orderItem.spec?.image ??
                                                    orderItem.product
                                                        ?.images?.[0] ??
                                                    '/logo.svg'
                                                }
                                                alt={
                                                    orderItem.product?.title ||
                                                    '商品'
                                                }
                                                w="56px"
                                                h="56px"
                                                borderRadius="md"
                                                objectFit="cover"
                                                bg="gray.100"
                                                flexShrink={0}
                                            />
                                            <Box flex="1" minW={0}>
                                                <Text
                                                    fontSize="sm"
                                                    textAlign="left"
                                                    whiteSpace="nowrap"
                                                    w="100%"
                                                    fontWeight="medium"
                                                    overflow="hidden"
                                                    color="gray.800"
                                                    textOverflow="ellipsis"
                                                    minW={0}
                                                >
                                                    {orderItem.product?.title ||
                                                        '未知商品'}
                                                </Text>
                                                <HStack
                                                    gap={2}
                                                    mt={1}
                                                    align="center"
                                                >
                                                    <Text
                                                        color="gray.500"
                                                        fontSize="xs"
                                                        whiteSpace="nowrap"
                                                        overflow="hidden"
                                                        textOverflow="ellipsis"
                                                        minW={0}
                                                        flex="1"
                                                    >
                                                        {orderItem.spec
                                                            ?.value ||
                                                            orderItem.specInfo ||
                                                            '默认规格'}
                                                    </Text>
                                                    <Text
                                                        color="gray.600"
                                                        fontSize="xs"
                                                        flexShrink={0}
                                                    >
                                                        ×{orderItem.quantity}
                                                    </Text>
                                                </HStack>
                                            </Box>
                                        </Flex>
                                    ))}
                                </VStack>
                            </Link>

                            <Box h="1px" bg="gray.100" my={2} />

                            {/* 底部：金额 + 操作 */}
                            <Flex align="center" justify="space-between">
                                <HStack gap={2}>
                                    <Text fontSize="xs" color="gray.500">
                                        共 {item.items?.length || 0} 件
                                    </Text>
                                    <Text
                                        fontSize="sm"
                                        color="gray.700"
                                        fontWeight="medium"
                                    >
                                        合计
                                    </Text>
                                    <Text
                                        fontSize="sm"
                                        color="red.500"
                                        fontWeight="bold"
                                    >
                                        ￥{item.totalPrice.toFixed(2)}
                                    </Text>
                                </HStack>

                                <HStack gap={2}>
                                    {item.status === 'DELIVERED' && (
                                        <Button
                                            size="2xs"
                                            colorScheme="blue"
                                            variant="solid"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleConfirmReceived(item.id);
                                            }}
                                            loading={confirmReceived.isPending}
                                        >
                                            确认收货
                                        </Button>
                                    )}
                                    {(item.status === 'PAID' ||
                                        item.status === 'CHECKED') && (
                                        <Button
                                            size="2xs"
                                            colorScheme="red"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setCancelOrderId(item.id);
                                                openCancelOrder();
                                            }}
                                            loading={cancelOrder.isPending}
                                        >
                                            取消订单
                                        </Button>
                                    )}
                                </HStack>
                            </Flex>
                        </Box>
                    ))
                ) : (
                    <> </>
                )}
            </Box>
            {/* 确认收货对话框 */}
            {ConfirmReceivedDialog}
            {CancelOrderDialog}
        </Box>
    );
}
