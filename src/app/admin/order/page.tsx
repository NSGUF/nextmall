'use client';
import React, { useMemo, useState, useCallback } from 'react';
import {
    Box,
    Button,
    Heading,
    Wrap,
    Text,
    Input,
    Badge,
    VStack,
    HStack,
    Image,
    Flex,
} from '@chakra-ui/react';
import { Field } from '@/app/_components/ui';
import {
    DialogRoot,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from '@/app/_components/ui/dialog';
import DataTable from '../_components/DataTable';
import { api } from '@/trpc/react';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { ContentLoading } from '@/app/_components/LoadingSpinner';
import { FiSearch } from 'react-icons/fi';

// 订单状态映射
const ORDER_STATUS_MAP = {
    PAID: { label: '待审核', color: 'orange' },
    CHECKED: { label: '待发货', color: 'blue' },
    DELIVERED: { label: '待收货', color: 'purple' },
    COMPLETED: { label: '已完成', color: 'green' },
    CANCELLED: { label: '已取消', color: 'red' },
} as const;

type OrderStatus = keyof typeof ORDER_STATUS_MAP;

export default function OrderManagePage() {
    // 搜索状态
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>(
        'ALL'
    );

    // 排序状态
    const [sorting, setSorting] = useState<any[]>([]);
    const orderBy = sorting[0]?.id;
    const order = sorting[0]?.desc ? 'desc' : 'asc';

    // 分页 state
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    // 获取订单数据
    const {
        data: orderResponse,
        refetch,
        isLoading,
    } = api.order.adminList.useQuery({
        ...(orderBy ? { orderBy, order } : {}),
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(searchTerm ? { search: searchTerm } : {}),
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    });

    const orders = orderResponse?.data ?? [];
    const pageCount = orderResponse?.pagination?.totalPages ?? 0;

    // 分页回调函数
    const handlePaginationChange = (newPagination: {
        pageIndex: number;
        pageSize: number;
    }) => {
        setPagination(newPagination);
    };

    // 获取订单统计
    const { data: orderStats } = api.order.getStats.useQuery();

    // 更新订单状态
    const updateOrderStatus = api.order.updateStatus.useMutation({
        onSuccess: () => {
            refetch();
        },
    });

    // 确认对话框
    const [approveOrderId, setApproveOrderId] = useState<string | null>(null);
    const {
        ConfirmDialog: ApproveConfirmDialog,
        open: openApproveConfirm,
        close: closeApproveConfirm,
    } = useConfirmDialog({
        title: '确认审核',
        content: '确定要审核通过该订单吗？',
        buttonProps: { style: { display: 'none' } },
        onConfirm: async () => {
            if (approveOrderId) {
                updateOrderStatus.mutate({
                    id: approveOrderId,
                    status: 'CHECKED',
                });
                setApproveOrderId(null);
            }
        },
        onCancel: () => setApproveOrderId(null),
    });

    // 发货弹窗状态
    const [shipOrderId, setShipOrderId] = useState<string | null>(null);
    const [isShipDialogOpen, setIsShipDialogOpen] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');

    // 处理发货
    const handleShip = async () => {
        if (shipOrderId && trackingNumber.trim()) {
            updateOrderStatus.mutate({
                id: shipOrderId,
                status: 'DELIVERED',
                trackingNumber: trackingNumber.trim(),
            });
            setIsShipDialogOpen(false);
            setShipOrderId(null);
            setTrackingNumber('');
        }
    };

    // 渲染商品信息
    const renderProductInfo = (items: any[]) => {
        return (
            <VStack align="start" gap={2} maxW="300px">
                {items.map((item: any, index: number) => (
                    <HStack key={index} gap={3} w="full">
                        <Image
                            src={
                                item.product?.images?.[0] || '/placeholder.png'
                            }
                            alt={item.product?.title || '商品'}
                            boxSize="40px"
                            objectFit="cover"
                            borderRadius="md"
                        />
                        <VStack align="start" gap={0} flex={1}>
                            <Text
                                fontSize="sm"
                                fontWeight="medium"
                                lineClamp={1}
                            >
                                {item.product?.title || '未知商品'}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                                {item.spec?.value} x{item.quantity}
                                {item.spec?.name || '默认'}
                            </Text>
                            <HStack gap={2} fontSize="xs">
                                单价：
                                <Text
                                    fontSize="xs"
                                    color="red.500"
                                    fontWeight="medium"
                                >
                                    ¥{item.price}
                                </Text>
                            </HStack>
                        </VStack>
                    </HStack>
                ))}
            </VStack>
        );
    };

    // 渲染用户地址信息
    const renderAddressInfo = (order: any) => {
        const address = order.address;
        if (!address)
            return (
                <Text fontSize="sm" color="gray.500">
                    无地址信息
                </Text>
            );

        return (
            <VStack align="start" gap={1} maxW="200px">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                    {address.name} {address.phone}
                </Text>
                <Text fontSize="xs" color="gray.500" lineClamp={2}>
                    {address.province?.split('/')?.[1]}
                    {address.city?.split('/')?.[1]}{' '}
                    {address.district?.split('/')?.[1]} {address.detail}
                </Text>
            </VStack>
        );
    };

    // 渲染操作按钮
    const renderActions = useCallback(
        (order: any) => {
            const status = order.status as OrderStatus;

            switch (status) {
                case 'PAID':
                    return (
                        <Button
                            size="2xs"
                            colorScheme="green"
                            onClick={() => {
                                setApproveOrderId(order.id);
                                openApproveConfirm();
                            }}
                            loading={updateOrderStatus.isPending}
                        >
                            审核通过
                        </Button>
                    );
                case 'CHECKED':
                    return (
                        <Button
                            size="2xs"
                            colorScheme="blue"
                            onClick={() => {
                                setShipOrderId(order.id);
                                setIsShipDialogOpen(true);
                            }}
                            loading={updateOrderStatus.isPending}
                        >
                            发货
                        </Button>
                    );
                case 'DELIVERED':
                    return (
                        <Badge colorScheme="purple" variant="subtle">
                            待收货
                        </Badge>
                    );
                case 'COMPLETED':
                    return (
                        <Badge colorScheme="green" variant="subtle">
                            已完成
                        </Badge>
                    );
                case 'CANCELLED':
                    return (
                        <Badge colorScheme="red" variant="subtle">
                            已取消
                        </Badge>
                    );
                default:
                    return null;
            }
        },
        [
            updateOrderStatus.isPending,
            openApproveConfirm,
            setApproveOrderId,
            setShipOrderId,
            setIsShipDialogOpen,
        ]
    );

    // 表格列定义
    const columns = useMemo(
        () => [
            {
                accessorKey: 'id',
                header: '订单编号',
                width: 120,
                cell: ({ row }: { row: any }) => (
                    <Text fontSize="sm" fontFamily="mono">
                        {row.original.id.slice(-8)}
                    </Text>
                ),
            },
            {
                accessorKey: 'items',
                header: '商品信息',
                width: 320,
                cell: ({ row }: { row: any }) =>
                    renderProductInfo(row.original.items),
            },
            {
                accessorKey: 'address',
                header: '用户信息',
                width: 220,
                cell: ({ row }: { row: any }) =>
                    renderAddressInfo(row.original),
            },
            {
                accessorKey: 'totalPrice',
                header: '订单金额',
                width: 100,
                cell: ({ row }: { row: any }) => (
                    <Text fontSize="sm" fontWeight="medium" color="red.500">
                        ¥{row.original.totalPrice}
                    </Text>
                ),
            },
            {
                accessorKey: 'status',
                header: '订单状态',
                width: 40,
                cell: ({ row }: { row: any }) => {
                    const status = row.original.status as OrderStatus;
                    const statusInfo = ORDER_STATUS_MAP[status];
                    return (
                        <Badge colorScheme={statusInfo.color} variant="subtle">
                            {statusInfo.label}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'trackingNumber',
                header: '物流单号',
                width: 120,
                cell: ({ row }: { row: any }) => (
                    <Text
                        fontSize="sm"
                        color={
                            row.original.trackingNumber
                                ? 'blue.600'
                                : 'gray.400'
                        }
                    >
                        {row.original.trackingNumber || '暂无'}
                    </Text>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: '下单时间',
                width: 120,
                cell: ({ row }: { row: any }) => (
                    <Text fontSize="sm">
                        {new Date(row.original.createdAt).toLocaleString()}
                    </Text>
                ),
            },
            {
                id: 'actions',
                header: '操作',
                width: 120,
                cell: ({ row }: { row: any }) => renderActions(row.original),
            },
        ],
        [renderActions]
    );

    if (isLoading) {
        return <ContentLoading text="订单数据加载中..." />;
    }

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Heading size="lg">订单管理</Heading>
            </Box>

            {/* 统计卡片 */}
            {orderStats && (
                <Flex gap={4} mb={6} wrap="wrap">
                    <Box bg="blue.50" p={4} borderRadius="md" minW="120px">
                        <Text
                            fontSize="sm"
                            color="blue.600"
                            fontWeight="medium"
                        >
                            总订单
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                            {orderStats.total}
                        </Text>
                    </Box>
                    <Box bg="orange.50" p={4} borderRadius="md" minW="120px">
                        <Text
                            fontSize="sm"
                            color="orange.600"
                            fontWeight="medium"
                        >
                            待审核
                        </Text>
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color="orange.700"
                        >
                            {orderStats.paid}
                        </Text>
                    </Box>
                    <Box bg="purple.50" p={4} borderRadius="md" minW="120px">
                        <Text
                            fontSize="sm"
                            color="purple.600"
                            fontWeight="medium"
                        >
                            待发货
                        </Text>
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color="purple.700"
                        >
                            {orderStats.checked}
                        </Text>
                    </Box>
                    <Box bg="blue.50" p={4} borderRadius="md" minW="120px">
                        <Text
                            fontSize="sm"
                            color="blue.600"
                            fontWeight="medium"
                        >
                            待收货
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                            {orderStats.delivered}
                        </Text>
                    </Box>
                    <Box bg="green.50" p={4} borderRadius="md" minW="120px">
                        <Text
                            fontSize="sm"
                            color="green.600"
                            fontWeight="medium"
                        >
                            已完成
                        </Text>
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color="green.700"
                        >
                            {orderStats.completed}
                        </Text>
                    </Box>
                </Flex>
            )}

            {/* 搜索和筛选 */}
            <Flex gap={4} mb={4} align="center">
                <Box position="relative" maxW="500px">
                    <Input
                        placeholder="搜索订单编号、用户名"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        pl={10}
                        minW="300px"
                    />
                    <Box
                        position="absolute"
                        left={3}
                        top="50%"
                        transform="translateY(-50%)"
                    >
                        <FiSearch color="gray" size={16} />
                    </Box>
                </Box>

                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(e.target.value as OrderStatus | 'ALL')
                    }
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white',
                    }}
                >
                    <option value="ALL">全部状态</option>
                    {Object.entries(ORDER_STATUS_MAP).map(([key, value]) => (
                        <option key={key} value={key}>
                            {value.label}
                        </option>
                    ))}
                </select>
            </Flex>

            <DataTable
                columns={columns}
                data={orders}
                onSortingChange={setSorting}
                manualSorting
                manualPagination
                pageCount={pageCount}
                onPaginationChange={handlePaginationChange}
            />

            {ApproveConfirmDialog}

            {/* 发货弹窗 */}
            <DialogRoot
                open={isShipDialogOpen}
                onOpenChange={({ open }) => setIsShipDialogOpen(open)}
                size="md"
                placement="center"
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>发货确认</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <VStack gap={4} align="stretch">
                            <Text fontSize="sm" color="gray.600">
                                请输入物流单号，确认发货后订单状态将变更为&ldquo;待收货&rdquo;
                            </Text>
                            <Field label="物流单号" required>
                                <Input
                                    placeholder="请输入物流单号"
                                    value={trackingNumber}
                                    onChange={(e) =>
                                        setTrackingNumber(e.target.value)
                                    }
                                />
                            </Field>
                        </VStack>
                    </DialogBody>
                    <DialogFooter gap={2}>
                        <DialogActionTrigger asChild>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsShipDialogOpen(false);
                                    setShipOrderId(null);
                                    setTrackingNumber('');
                                }}
                            >
                                取消
                            </Button>
                        </DialogActionTrigger>
                        <Button
                            colorScheme="blue"
                            onClick={handleShip}
                            loading={updateOrderStatus.isPending}
                            disabled={!trackingNumber.trim()}
                        >
                            确认发货
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </Box>
    );
}
