'use client';

import { Box, Flex, Grid, Button, Text, Badge, Avatar } from '@chakra-ui/react';
import {
    FiSettings,
    FiHeadphones,
    FiBell,
    FiChevronRight,
    FiCreditCard,
    FiGift,
    FiShoppingBag,
    FiTruck,
    FiCheckCircle,
    FiRefreshCw,
    FiUser,
    FiMapPin,
    FiList,
    FiDollarSign,
} from 'react-icons/fi';
import { LuCrown, LuLanguages } from 'react-icons/lu';
import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/trpc/react';

function IconWithBadge({
    icon,
    count,
}: {
    icon: React.ReactNode;
    count: number;
}) {
    const displayCount = count > 99 ? '99+' : count.toString();

    return (
        <Box position="relative" display="inline-block">
            {icon}
            {count > 0 && (
                <Box
                    position="absolute"
                    top="-8px"
                    right="-12px"
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    minW="18px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="10px"
                    fontWeight="bold"
                    px="4px"
                >
                    {displayCount}
                </Box>
            )}
        </Box>
    );
}

export default function MePage() {
    const { session } = useAuth();
    const { data: userStats } = api.user.getStats.useQuery();

    return (
        <Box
            style={{
                background: 'linear-gradient(to bottom,#fefcfd, #f2f3f7 100%)',
            }}
            minH="100vh"
            pb="80px"
        >
            {/* 头部用户信息 */}
            <Box px={4} pt={6} pb={2}>
                <Flex align="center" justify="space-between">
                    <Flex align="center" gap={3}>
                        <Avatar.Root>
                            <Avatar.Fallback
                                name={session?.user?.name || 'User'}
                            />
                        </Avatar.Root>
                        <Box>
                            <Text fontWeight="bold" fontSize="xl">
                                {session?.user?.name || '用户'}
                            </Text>
                        </Box>
                    </Flex>
                </Flex>
                {/* 资产栏 */}
                <Flex mt={6} justify="space-between" align="center" px={8}>
                    <Box textAlign="center">
                        <Text fontWeight="bold" fontSize="lg">
                            0
                        </Text>
                        <Text color="gray.500" fontSize="sm">
                            优惠券
                        </Text>
                    </Box>
                    <Link href="/full/favorite">
                        <Box textAlign="center">
                            <Text fontWeight="bold" fontSize="lg">
                                {userStats?.favoritesCount || 0}
                            </Text>
                            <Text color="gray.500" fontSize="sm">
                                我的收藏
                            </Text>
                        </Box>
                    </Link>
                    <Link href="/full/footprint">
                        <Box textAlign="center">
                            <Text fontWeight="bold" fontSize="lg">
                                {userStats?.footprintsCount || 0}
                            </Text>
                            <Text color="gray.500" fontSize="sm">
                                我的足迹
                            </Text>
                        </Box>
                    </Link>
                </Flex>
            </Box>

            {/* 我的订单 */}
            <Box
                bg="white"
                mx={4}
                borderRadius="xl"
                p={4}
                mb={4}
                mt={8}
                boxShadow="2xs"
            >
                <Flex justify="space-between" align="center" mb={2}>
                    <Text fontWeight="bold">我的订单</Text>
                    <Link href="/full/order">
                        <Flex
                            align="center"
                            color="gray.500"
                            fontSize="sm"
                            cursor="pointer"
                        >
                            全部订单 <FiChevronRight />
                        </Flex>
                    </Link>
                </Flex>
                <Grid templateColumns="repeat(5, 1fr)" gap={2} mt={4}>
                    <Link href="/full/order?status=PAID">
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            cursor="pointer"
                        >
                            <IconWithBadge
                                icon={<FiCreditCard size={24} />}
                                count={userStats?.orderCounts?.paid || 0}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                待审核
                            </Text>
                        </Flex>
                    </Link>
                    <Link href="/full/order?status=CHECKED">
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            cursor="pointer"
                        >
                            <IconWithBadge
                                icon={<FiGift size={24} />}
                                count={userStats?.orderCounts?.checked || 0}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                待发货
                            </Text>
                        </Flex>
                    </Link>
                    <Link href="/full/order?status=DELIVERED">
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            cursor="pointer"
                        >
                            <IconWithBadge
                                icon={<FiTruck size={24} />}
                                count={userStats?.orderCounts?.delivered || 0}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                待收货
                            </Text>
                        </Flex>
                    </Link>
                    <Link href="/full/order?status=COMPLETED">
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            cursor="pointer"
                        >
                            <IconWithBadge
                                icon={<FiCheckCircle size={24} />}
                                count={userStats?.orderCounts?.completed || 0}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                已完成
                            </Text>
                        </Flex>
                    </Link>
                    <Link href="/full/order?status=CANCELLED">
                        <Flex
                            direction="column"
                            align="center"
                            justify="center"
                            cursor="pointer"
                        >
                            <IconWithBadge
                                icon={<FiRefreshCw size={24} />}
                                count={userStats?.orderCounts?.cancelled || 0}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                退款退货
                            </Text>
                        </Flex>
                    </Link>
                </Grid>
            </Box>

            {/* 分销中心/积分商城 */}
            {/* <Box bg="white" mx={2} borderRadius="xl" p={4} mb={4} boxShadow="xs">
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <Flex direction="column" align="center" cursor="pointer">
                        <FiDollarSign size={28} color="#FF7F50" />
                        <Text fontWeight="bold" mt={1}>分销中心</Text>
                        <Text fontSize="xs" color="gray.500">分享转化获佣金</Text>
                    </Flex>
                    <Flex direction="column" align="center" cursor="pointer">
                        <FiGift size={28} color="#4682B4" />
                        <Text fontWeight="bold" mt={1}>积分商城</Text>
                        <Text fontSize="xs" color="gray.500">攒积分兑好礼</Text>
                    </Flex>
                    <Flex direction="column" align="center" cursor="pointer">
                        <FiShoppingBag size={28} color="#8A2BE2" />
                        <Text fontWeight="bold" mt={1}>更多服务</Text>
                        <Text fontSize="xs" color="gray.500">敬请期待</Text>
                    </Flex>
                </Grid>
            </Box> */}

            {/* 服务与工具 九宫格 */}
            <Box
                bg="white"
                mx={4}
                borderRadius="xl"
                p={4}
                mb={4}
                boxShadow="2xs"
            >
                <Text fontWeight="bold" mb={3}>
                    服务与工具
                </Text>
                <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                    <Link href="/full/address">
                        <Flex
                            direction="column"
                            align="center"
                            cursor="pointer"
                        >
                            <FiMapPin size={24} />
                            <Text fontSize="sm" mt={1}>
                                地址管理
                            </Text>
                        </Flex>
                    </Link>
                    {/* <Flex direction="column" align="center" cursor="pointer">
                        <FiHeadphones size={24} />
                        <Text fontSize="sm" mt={1}>官方客服</Text>
                    </Flex>
                    <Flex direction="column" align="center" cursor="pointer">
                        <FiSettings size={24} />
                        <Text fontSize="sm" mt={1}>系统设置</Text>
                    </Flex> */}
                </Grid>
            </Box>
        </Box>
    );
}
