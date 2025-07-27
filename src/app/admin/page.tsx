'use client';

import {
    Box,
    Grid,
    GridItem,
    Text,
    VStack,
    Heading,
    Spinner,
    Center,
    HStack,
    Flex,
} from '@chakra-ui/react';
import {
    FiUsers,
    FiShoppingBag,
    FiDollarSign,
    FiTrendingUp,
    FiActivity,
    FiCalendar,
    FiClock,
} from 'react-icons/fi';
import { api } from '@/trpc/react';
import StockAlert from './_components/StockAlert';
import VendorDataView from './_components/VendorDataView';
import StatCard from './_components/StatsCard';

export default function AdminPage() {
    // 获取统计数据
    const { data: userStats, isLoading: userLoading } =
        api.dashboard.getUserStats.useQuery();
    const { data: orderStats, isLoading: orderLoading } =
        api.dashboard.getOrderStats.useQuery();
    const { data: transactionStats, isLoading: transactionLoading } =
        api.dashboard.getTransactionStats.useQuery();

    const isLoading = userLoading || orderLoading || transactionLoading;

    if (isLoading) {
        return (
            <Center h="400px">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Heading size="lg">后台首页</Heading>
            </Box>
            <VStack gap={6} align="stretch">
                <Flex gap={4} alignContent="space-between">
                    <StatCard
                        data={{
                            icon: FiUsers,
                            title: '用户总量',
                            total: userStats?.total || 0,
                            todayActive: userStats?.todayActive || 0,
                            yesterdayActive: userStats?.yesterdayActive || 0,
                            currentMonthActive:
                                userStats?.currentMonthActive || 0,
                            lastMonthActive: userStats?.lastMonthActive || 0,
                        }}
                    />
                    <StatCard
                        data={{
                            icon: FiShoppingBag,
                            title: '订单总量',
                            total: orderStats?.total || 0,
                            todayActive: orderStats?.today || 0,
                            yesterdayActive: orderStats?.yesterday || 0,
                            currentMonthActive: orderStats?.currentMonth || 0,
                            lastMonthActive: orderStats?.lastMonth || 0,
                        }}
                    />

                    <StatCard
                        data={{
                            icon: FiDollarSign,
                            title: '成交总量',
                            total: transactionStats?.total.count || 0,
                            todayActive: transactionStats?.today.count || 0,
                            yesterdayActive:
                                transactionStats?.yesterday.count || 0,
                            currentMonthActive:
                                transactionStats?.currentMonth.count || 0,
                            lastMonthActive:
                                transactionStats?.lastMonth.count || 0,
                        }}
                    />

                    <StatCard
                        data={{
                            icon: FiClock,
                            title: '成交总计',
                            total:
                                (transactionStats?.total.amount || 0).toFixed(
                                    2
                                ) || 0,
                            todayActive: (
                                transactionStats?.today.amount || 0
                            ).toFixed(2),
                            yesterdayActive: (
                                transactionStats?.yesterday.amount || 0
                            ).toFixed(2),
                            currentMonthActive: (
                                transactionStats?.currentMonth.amount || 0
                            ).toFixed(2),
                            lastMonthActive:
                                (
                                    transactionStats?.lastMonth.amount || 0
                                ).toFixed(2) || 0,
                        }}
                    />
                </Flex>
                {/* 库存预警和供应商数据 */}
                <Grid templateColumns={{ base: '1fr', xl: '1fr 1fr' }} gap={6}>
                    <GridItem>
                        <StockAlert />
                    </GridItem>
                </Grid>
            </VStack>
        </Box>
    );
}
