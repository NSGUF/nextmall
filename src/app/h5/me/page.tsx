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

function IconCircleButton({
    icon,
    label,
}: {
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            aria-label={label}
            style={{
                background: 'none',
                border: 'none',
                padding: 4,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
            }}
            tabIndex={0}
        >
            {icon}
        </button>
    );
}

export default function MePage() {
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
                            <Avatar.Fallback name="Segun Adebayo" />
                        </Avatar.Root>
                        <Box>
                            <Text fontWeight="bold" fontSize="xl">
                                u2522
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
                                0
                            </Text>
                            <Text color="gray.500" fontSize="sm">
                                我的收藏
                            </Text>
                        </Box>
                    </Link>
                    <Link href="/full/footprint">
                        <Box textAlign="center">
                            <Text fontWeight="bold" fontSize="lg">
                                0
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
                    <Flex
                        align="center"
                        color="gray.500"
                        fontSize="sm"
                        cursor="pointer"
                    >
                        全部订单 <FiChevronRight />
                    </Flex>
                </Flex>
                <Grid templateColumns="repeat(5, 1fr)" gap={2} mt={4}>
                    <Flex direction="column" align="center" justify="center">
                        <FiCreditCard size={24} />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            待审核
                        </Text>
                    </Flex>
                    <Flex direction="column" align="center" justify="center">
                        <FiGift size={24} />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            待发货
                        </Text>
                    </Flex>
                    <Flex direction="column" align="center" justify="center">
                        <FiTruck size={24} />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            待收货
                        </Text>
                    </Flex>
                    <Flex direction="column" align="center" justify="center">
                        <FiCheckCircle size={24} />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            已完成
                        </Text>
                    </Flex>
                    <Flex direction="column" align="center" justify="center">
                        <FiRefreshCw size={24} />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                            退款退货
                        </Text>
                    </Flex>
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
