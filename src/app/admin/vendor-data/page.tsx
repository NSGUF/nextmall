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
} from '@chakra-ui/react';
import { useState } from 'react';
import { api } from '@/trpc/react';

export default function VendorDataPage() {
    const [selectedVendor, setSelectedVendor] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear()
    );
    const [page, setPage] = useState(1);
    const pageSize = 20;

    // 获取供应商列表
    const { data: vendors } = api.dashboard.getVendorList.useQuery();

    // 获取供应商数据
    const {
        data: vendorData,
        isLoading,
        error,
    } = api.dashboard.getVendorData.useQuery({
        vendorId: selectedVendor || undefined,
        year: selectedYear,
        page,
        pageSize,
    });

    // 生成年份选项（最近5年）
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleVendorChange = (vendorId: string) => {
        setSelectedVendor(vendorId);
        setPage(1);
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
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
                <Flex gap={4} wrap="wrap" align="end">
                    <Box>
                        <Text
                            fontSize="sm"
                            mb={2}
                            color="gray.600"
                            fontWeight="medium"
                        >
                            选择供应商
                        </Text>

                        <NativeSelect.Root size="sm" width="240px">
                            <NativeSelect.Field
                                placeholder="全部供应商"
                                value={selectedVendor}
                                onChange={(e) => {
                                    handleVendorChange(e.currentTarget.value);
                                    debugger;
                                }}
                                w="250px"
                            >
                                {vendors?.map((vendor) => (
                                    <option key={vendor.id} value={vendor.id}>
                                        {vendor.name || vendor.email}
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Box>

                    <Box>
                        <Text
                            fontSize="sm"
                            mb={2}
                            color="gray.600"
                            fontWeight="medium"
                        >
                            选择年份
                        </Text>

                        <NativeSelect.Root size="sm">
                            <NativeSelect.Field
                                value={selectedYear}
                                onChange={(e) =>
                                    handleYearChange(
                                        Number(e.currentTarget.value)
                                    )
                                }
                                w="150px"
                            >
                                {yearOptions.map((year) => (
                                    <option key={year} value={year}>
                                        {year}年
                                    </option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </Box>

                    <Button
                        colorScheme="blue"
                        onClick={() => {
                            setSelectedVendor('');
                            setSelectedYear(currentYear);
                            setPage(1);
                        }}
                    >
                        重置筛选
                    </Button>
                </Flex>
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
                            暂无数据 -{' '}
                            {selectedVendor || selectedYear !== currentYear
                                ? '当前筛选条件下暂无数据，请尝试调整筛选条件'
                                : '暂无供应商订单数据'}
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
                                            总订单金额
                                        </Table.ColumnHeader>
                                        <Table.ColumnHeader>
                                            月度数据详情
                                        </Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {vendorData.vendors.map((vendor) => (
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
                                                    color="red.500"
                                                    fontSize="lg"
                                                >
                                                    ¥
                                                    {vendor.totalAmount.toLocaleString(
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
                                                            (monthData) => (
                                                                <Badge
                                                                    key={
                                                                        monthData.month
                                                                    }
                                                                    colorScheme="purple"
                                                                    variant="outline"
                                                                    fontSize="xs"
                                                                    px={2}
                                                                    py={1}
                                                                    title={`${monthData.month}月: ${monthData.orderCount}单, ¥${monthData.totalAmount.toFixed(2)}`}
                                                                >
                                                                    {
                                                                        monthData.month
                                                                    }
                                                                    月:{' '}
                                                                    {
                                                                        monthData.orderCount
                                                                    }
                                                                    单 / <Text color="red.500">¥
                                                                    {monthData.totalAmount.toLocaleString(
                                                                        'zh-CN',
                                                                        {
                                                                            maximumFractionDigits: 0,
                                                                        }
                                                                    )}</Text>
                                                                </Badge>
                                                            )
                                                        )
                                                    )}
                                                </Flex>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
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
                                        isDisabled={page <= 1}
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
