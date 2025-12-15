'use client';

import {
    Box,
    Text,
    Table,
    NativeSelect,
    Flex,
    Button,
    HStack,
    Spinner,
    Center,
    Badge,
    VStack,
    Input,
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { api } from '@/trpc/react';

export default function VendorDataPage() {
    const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
    const [presetRange, setPresetRange] = useState<string>('week');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    // 计算日期范围
    const dateRange = useMemo(() => {
        if (dateMode === 'custom' && startDate && endDate) {
            return {
                startDate: new Date(startDate),
                endDate: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        }

        // 获取昨天的日期（不包含今天）
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const end = new Date(yesterday.setHours(23, 59, 59, 999));
        let start = new Date(yesterday);

        switch (presetRange) {
            case 'week':
                start.setDate(start.getDate() - 6); // 昨天往前推6天，总共7天
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
        }
        start.setHours(0, 0, 0, 0);

        return { startDate: start, endDate: end };
    }, [dateMode, presetRange, startDate, endDate]);

    // 获取供应商数据 - 只获取当前用户的数据
    const {
        data: vendorData,
        isLoading,
        error,
    } = api.dashboard.getVendorData.useQuery({
        // 移除 vendorId 参数，让后端根据当前用户身份获取数据
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        page,
        pageSize,
    });

    const handleReset = () => {
        setDateMode('preset');
        setPresetRange('week');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    if (error) {
        return (
            <VStack gap={6} align="stretch">
                <Box>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                        供应商数据查看
                    </Text>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                        查看各供应商的订单数据和月度统计
                    </Text>
                </Box>
                <Box
                    p={4}
                    bg="red.50"
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="red.200"
                >
                    <Text fontSize="sm" color="red.600" fontWeight="medium">
                        加载失败: {error.message}
                    </Text>
                </Box>
            </VStack>
        );
    }

    return (
        <VStack gap={6} align="stretch">
            {/* 页面标题 */}
            <Box>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                    供应商数据查看
                </Text>
                <Text fontSize="sm" color="gray.600" mt={1}>
                    查看各供应商的订单数据和月度统计
                </Text>
            </Box>

            {/* 筛选器 */}
            <Box
                bg="white"
                p={6}
                borderRadius="lg"
                borderWidth={1}
                borderColor="gray.200"
            >
                <VStack gap={4} align="stretch">
                    <Flex gap={4} wrap="wrap" align="end">
                        <Box>
                            <Text fontSize="sm" mb={2} fontWeight="medium">
                                日期模式
                            </Text>
                            <NativeSelect.Root width="150px">
                                <NativeSelect.Field
                                    value={dateMode}
                                    onChange={(e) => {
                                        setDateMode(
                                            e.currentTarget.value as
                                                | 'preset'
                                                | 'custom'
                                        );
                                        setPage(1);
                                    }}
                                >
                                    <option value="preset">快捷选择</option>
                                    <option value="custom">自定义日期</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Box>

                        {dateMode === 'preset' ? (
                            <Box>
                                <Text fontSize="sm" mb={2} fontWeight="medium">
                                    时间范围
                                </Text>
                                <NativeSelect.Root width="150px">
                                    <NativeSelect.Field
                                        value={presetRange}
                                        onChange={(e) => {
                                            setPresetRange(
                                                e.currentTarget.value
                                            );
                                            setPage(1);
                                        }}
                                    >
                                        <option value="week">最近一周</option>
                                        <option value="month">
                                            最近一个月
                                        </option>
                                        <option value="quarter">
                                            最近三个月
                                        </option>
                                        <option value="year">最近一年</option>
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Box>
                        ) : (
                            <>
                                <Box>
                                    <Text
                                        fontSize="sm"
                                        mb={2}
                                        fontWeight="medium"
                                    >
                                        开始日期
                                    </Text>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setPage(1);
                                        }}
                                        width="180px"
                                    />
                                </Box>
                                <Box>
                                    <Text
                                        fontSize="sm"
                                        mb={2}
                                        fontWeight="medium"
                                    >
                                        结束日期
                                    </Text>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setPage(1);
                                        }}
                                        width="180px"
                                    />
                                </Box>
                            </>
                        )}

                        <Button colorScheme="blue" onClick={handleReset}>
                            重置筛选
                        </Button>
                    </Flex>

                    <Text fontSize="sm" color="gray.600">
                        当前查询时间段:{' '}
                        {dateRange.startDate.toLocaleDateString('zh-CN')} -{' '}
                        {dateRange.endDate.toLocaleDateString('zh-CN')}
                    </Text>
                </VStack>
            </Box>

            {/* 数据表格 */}
            <Box
                bg="white"
                p={6}
                borderRadius="lg"
                borderWidth={1}
                borderColor="gray.200"
            >
                {isLoading ? (
                    <Center py={12}>
                        <VStack gap={4}>
                            <Spinner size="xl" />
                            <Text color="gray.500">加载中...</Text>
                        </VStack>
                    </Center>
                ) : !vendorData || vendorData.vendors.length === 0 ? (
                    <Box
                        p={4}
                        bg="blue.50"
                        borderRadius="md"
                        borderWidth={1}
                        borderColor="blue.200"
                    >
                        <Text
                            fontSize="sm"
                            color="blue.600"
                            fontWeight="medium"
                        >
                            暂无数据 -
                            当前筛选条件下暂无数据，请尝试调整筛选条件
                        </Text>
                    </Box>
                ) : (
                    <>
                        <Box overflowX="auto">
                            <Table.Root size="md" showColumnBorder>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.ColumnHeader>
                                            供应商
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader>
                                            总订单数
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader>
                                            总进货成本
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader>
                                            总快递成本
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader>
                                            月度数据详情
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {vendorData.vendors.map((vendor) => {
                                        const profit =
                                            vendor.totalAmount -
                                            vendor.totalCost;
                                        const profitMargin =
                                            vendor.totalAmount > 0
                                                ? (profit /
                                                      vendor.totalAmount) *
                                                  100
                                                : 0;

                                        return (
                                            <Table.Row key={vendor.vendorId}>
                                                <Table.Cell>
                                                    <Text
                                                        fontWeight="medium"
                                                        fontSize="md"
                                                    >
                                                        {vendor.vendorName}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {vendor.totalOrders} 单
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text
                                                        fontWeight="bold"
                                                        color="orange.600"
                                                        fontSize="lg"
                                                    >
                                                        ¥
                                                        {vendor.totalCost.toLocaleString(
                                                            'zh-CN',
                                                            {
                                                                minimumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Text
                                                        fontWeight="bold"
                                                        color="purple.600"
                                                        fontSize="lg"
                                                    >
                                                        ¥
                                                        {vendor.totalLogisticsCost.toLocaleString(
                                                            'zh-CN',
                                                            {
                                                                minimumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </Text>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Flex gap={2} wrap="wrap">
                                                        {vendor.monthlyData
                                                            .length === 0 ? (
                                                            <Text
                                                                fontSize="sm"
                                                                color="gray.500"
                                                            >
                                                                暂无月度数据
                                                            </Text>
                                                        ) : (
                                                            vendor.monthlyData.map(
                                                                (monthData) => {
                                                                    // 计算进货成本（不含快递费）
                                                                    const purchaseCost =
                                                                        monthData.totalCost -
                                                                        monthData.totalLogisticsCost;
                                                                    return (
                                                                        <Badge
                                                                            key={
                                                                                monthData.month
                                                                            }
                                                                            colorScheme="purple"
                                                                            variant="outline"
                                                                            fontSize="xs"
                                                                            px={
                                                                                2
                                                                            }
                                                                            py={
                                                                                1
                                                                            }
                                                                            title={`${monthData.month}月: ${monthData.orderCount}单, 进货成本¥${purchaseCost.toFixed(2)}, 快递成本¥${monthData.totalLogisticsCost.toFixed(2)}`}
                                                                        >
                                                                            {
                                                                                monthData.month
                                                                            }
                                                                            月:{' '}
                                                                            {
                                                                                monthData.orderCount
                                                                            }
                                                                            单 /{' '}
                                                                            <Text color="orange.600">
                                                                                进¥
                                                                                {purchaseCost.toLocaleString(
                                                                                    'zh-CN',
                                                                                    {
                                                                                        maximumFractionDigits: 0,
                                                                                    }
                                                                                )}
                                                                            </Text>
                                                                            {
                                                                                ' / '
                                                                            }
                                                                            <Text color="purple.600">
                                                                                快¥
                                                                                {monthData.totalLogisticsCost.toLocaleString(
                                                                                    'zh-CN',
                                                                                    {
                                                                                        maximumFractionDigits: 0,
                                                                                    }
                                                                                )}
                                                                            </Text>
                                                                        </Badge>
                                                                    );
                                                                }
                                                            )
                                                        )}
                                                    </Flex>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table.Root>
                        </Box>

                        {/* 分页 */}
                        {vendorData.totalPages > 1 && (
                            <Flex
                                justify="space-between"
                                align="center"
                                mt={6}
                                pt={4}
                                borderTop="1px"
                                borderColor="gray.200"
                            >
                                <Text fontSize="sm" color="gray.600">
                                    共 {vendorData.total} 个供应商，第 {page}{' '}
                                    页，共 {vendorData.totalPages} 页
                                </Text>
                                <HStack gap={2}>
                                    <Button
                                        size="sm"
                                        onClick={() => setPage(1)}
                                        disabled={page <= 1}
                                        variant="outline"
                                    >
                                        首页
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page <= 1}
                                        variant="outline"
                                    >
                                        上一页
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= vendorData.totalPages}
                                        variant="outline"
                                    >
                                        下一页
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            setPage(vendorData.totalPages)
                                        }
                                        disabled={page >= vendorData.totalPages}
                                        variant="outline"
                                    >
                                        末页
                                    </Button>
                                </HStack>
                            </Flex>
                        )}
                    </>
                )}
            </Box>
        </VStack>
    );
}
