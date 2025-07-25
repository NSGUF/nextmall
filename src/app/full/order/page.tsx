'use client';

import { Box, Flex, Image, Text, Button, Badge } from '@chakra-ui/react';
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

    // 当URL参数变化时更新选中的标签（现在由 TabBar 自动处理）
    // useEffect(() => {
    //     if (statusFromUrl) {
    //         setActiveCollectionId(statusFromUrl);
    //     }
    // }, [statusFromUrl]);

    if (orderLoading) {
        return (
            <Box bg="#f5f5f7" minH="100vh" pb="100px">
                <TopNav title="订单列表" onBack={() => router.push('/h5/me')} />
                <ContentLoading text="订单加载中..." />
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
                            position="relative"
                        >
                            <Link
                                href={'/full/order/detail?orderId=' + item.id}
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
                                                {item.items[0]?.spec?.value ||
                                                    '默认规格'}{' '}
                                                x {item.items?.[0]?.quantity}
                                            </Text>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </Link>
                            {/* 订单状态 Badge */}
                            <Flex position="absolute" bottom="8px" right="8px">
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
                                {/* 待收货状态显示确认收货按钮 */}
                                {item.status === 'DELIVERED' && (
                                    <Button
                                        size="2xs"
                                        colorScheme="blue"
                                        ml={2}
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
                            </Flex>
                        </Box>
                    ))
                ) : (
                    <> </>
                )}
            </Box>
            {/* 确认收货对话框 */}
            {ConfirmReceivedDialog}
        </Box>
    );
}
