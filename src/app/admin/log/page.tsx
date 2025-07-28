'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Flex,
    Text,
    Input,
    Button,
    Table,
    Badge,
    Spinner,
    Center,
} from '@chakra-ui/react';
import { api } from '@/trpc/react';
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import useCustomToast from '@/app/hooks/useCustomToast';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

// 定义日志状态类型
type LogStatus = 'SUCCESS' | 'FAILED' | 'WARNING';

const LOG_STATUS_COLORS = {
    SUCCESS: 'green',
    FAILED: 'red',
    WARNING: 'yellow',
} as const;

const LOG_STATUS_LABELS = {
    SUCCESS: '成功',
    FAILED: '失败',
    WARNING: '警告',
} as const;

export default function LogPage() {
    const { showSuccessToast, showErrorToast } = useCustomToast();

    // 筛选状态
    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 20,
        search: '',
    });

    // 本地搜索状态（用于输入框显示）
    const [searchInput, setSearchInput] = useState('');

    // 执行搜索
    const handleSearch = () => {
        setFilters((prev) => ({
            ...prev,
            search: searchInput,
            page: 1,
        }));
    };

    // 处理回车键搜索
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // 获取日志列表
    const {
        data: logData,
        isLoading,
        refetch,
    } = api.log.getList.useQuery({
        ...filters,
    });

    // 获取统计数据
    const { data: stats } = api.log.getStats.useQuery({});

    // 清理旧日志
    const cleanMutation = api.log.cleanOldLogs.useMutation({
        onSuccess: (data) => {
            showSuccessToast(`清理完成，删除了 ${data.deletedCount} 条记录`);
            void refetch();
        },
        onError: (error) => {
            showErrorToast(error.message);
        },
    });

    // 确认清理对话框
    const { ConfirmDialog: CleanConfirmDialog, open: openCleanConfirm } =
        useConfirmDialog({
            title: '确认清理',
            content: '确定要清理90天前的日志吗？此操作不可恢复。',
            confirmText: '清理',
            buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
            cancelText: '取消',
            onConfirm: async () => {
                await cleanMutation.mutateAsync({ daysToKeep: 90 });
            },
        });

    // 处理筛选变化
    const handleFilterChange = (key: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1,
        }));
    };

    // 格式化时间
    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('zh-CN');
    };

    // 格式化持续时间
    const formatDuration = (duration?: number) => {
        if (!duration) return '-';
        if (duration < 1000) return `${duration}ms`;
        return `${(duration / 1000).toFixed(2)}s`;
    };

    if (isLoading) {
        return (
            <Center h="50vh">
                <Spinner size="lg" color="blue.500" />
            </Center>
        );
    }

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Flex justify="space-between" align="center" mb={6}>
                <Text fontSize="2xl" fontWeight="bold">
                    操作日志
                </Text>
                <Flex gap={4}>
                    <Button onClick={() => void refetch()}>
                        <FiRefreshCw style={{ marginRight: '8px' }} />
                        刷新
                    </Button>
                    {/* <Button
                        colorScheme="red"
                        variant="outline"
                        onClick={openCleanConfirm}
                    >
                        <FiTrash2 style={{ marginRight: '8px' }} />
                        清理旧日志
                    </Button> */}
                </Flex>
            </Flex>

            {/* 统计卡片 */}
            {stats && (
                <Flex mb={6} gap={4}>
                    <Box
                        flex="1"
                        p={4}
                        bg="white"
                        borderRadius="md"
                        borderWidth={1}
                    >
                        <Text fontSize="sm" color="gray.500">
                            总操作数
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold">
                            {stats.statusStats.reduce(
                                (sum, item) => sum + item.count,
                                0
                            )}
                        </Text>
                    </Box>
                    <Box
                        flex="1"
                        p={4}
                        bg="white"
                        borderRadius="md"
                        borderWidth={1}
                    >
                        <Text fontSize="sm" color="gray.500">
                            成功操作
                        </Text>
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color="green.500"
                        >
                            {stats.statusStats.find(
                                (s) => s.status === 'SUCCESS'
                            )?.count || 0}
                        </Text>
                    </Box>
                    <Box
                        flex="1"
                        p={4}
                        bg="white"
                        borderRadius="md"
                        borderWidth={1}
                    >
                        <Text fontSize="sm" color="gray.500">
                            失败操作
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                            {stats.statusStats.find(
                                (s) => s.status === 'FAILED'
                            )?.count || 0}
                        </Text>
                    </Box>
                    <Box
                        flex="1"
                        p={4}
                        bg="white"
                        borderRadius="md"
                        borderWidth={1}
                    >
                        <Text fontSize="sm" color="gray.500">
                            热门模块
                        </Text>
                        <Text fontSize="lg" fontWeight="bold">
                            {stats.moduleStats[0]?.module || '-'}
                        </Text>
                    </Box>
                </Flex>
            )}

            {/* 搜索框 */}
            <Box mb={6} p={4} bg="white" borderRadius="md" borderWidth={1}>
                <Flex gap={2}>
                    <Input
                        placeholder="搜索描述、用户信息..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        flex={1}
                    />
                    <Button onClick={handleSearch} colorScheme="blue">
                        搜索
                    </Button>
                </Flex>
            </Box>

            {/* 日志表格 */}
            <Box bg="white" borderRadius="md" borderWidth={1}>
                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>时间</Table.ColumnHeader>
                            <Table.ColumnHeader>操作</Table.ColumnHeader>
                            <Table.ColumnHeader>模块</Table.ColumnHeader>
                            <Table.ColumnHeader>描述</Table.ColumnHeader>
                            <Table.ColumnHeader>用户</Table.ColumnHeader>
                            <Table.ColumnHeader>状态</Table.ColumnHeader>
                            {/* <Table.ColumnHeader>耗时</Table.ColumnHeader> */}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {logData?.logs.map((log) => (
                            <Table.Row key={log.id}>
                                <Table.Cell>
                                    <Text fontSize="sm">
                                        {formatDate(log.createdAt)}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge variant="outline">
                                        {log.action}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge colorScheme="blue" variant="outline">
                                        {log.module}
                                    </Badge>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="sm" maxW="300px">
                                        {log.description}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text fontSize="sm">
                                        {log.user?.name || log.userInfo || '-'}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Badge
                                        colorPalette={
                                            LOG_STATUS_COLORS[log.status]
                                        }
                                    >
                                        {LOG_STATUS_LABELS[log.status]}
                                    </Badge>
                                </Table.Cell>
                                {/* <Table.Cell>
                                    <Text fontSize="sm">
                                        {formatDuration(log.duration)}
                                    </Text>
                                </Table.Cell> */}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>

                {/* 分页 */}
                {logData && logData.totalPages > 1 && (
                    <Flex justify="space-between" align="center" p={4}>
                        <Text fontSize="sm" color="gray.500">
                            共 {logData.total} 条记录，第 {logData.page} /{' '}
                            {logData.totalPages} 页
                        </Text>
                        <Flex gap={2}>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={logData.page <= 1}
                                onClick={() =>
                                    handleFilterChange('page', logData.page - 1)
                                }
                            >
                                上一页
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={logData.page >= logData.totalPages}
                                onClick={() =>
                                    handleFilterChange('page', logData.page + 1)
                                }
                            >
                                下一页
                            </Button>
                        </Flex>
                    </Flex>
                )}
            </Box>

            {CleanConfirmDialog}
        </Box>
    );
}
