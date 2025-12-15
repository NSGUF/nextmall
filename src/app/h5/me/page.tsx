'use client';

import {
    Box,
    Flex,
    Grid,
    Button,
    Text,
    Badge,
    Avatar,
    Input,
} from '@chakra-ui/react';
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
    FiLogOut,
    FiLock,
} from 'react-icons/fi';
import { LuCrown, LuLanguages } from 'react-icons/lu';
import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/trpc/react';
import { ContentLoading } from '@/app/_components/LoadingSpinner';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
} from '@/app/_components/ui/dialog';
import { useRouter } from 'next/navigation';
import useCustomToast from '@/app/hooks/useCustomToast';
import { ROLES } from '@/app/const/status';

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
    const { session, logout } = useAuth();
    const router = useRouter();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    // 修改密码对话框状态
    const [showChangePwdDialog, setShowChangePwdDialog] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changing, setChanging] = useState(false);
    const [changePwdError, setChangePwdError] = useState<string | null>(null);

    const { showSuccessToast, showErrorToast } = useCustomToast();

    const { data: userStats, isLoading: statsLoading } =
        api.user.getStats.useQuery(undefined, {
            enabled: !!session, // 只在登录状态下请求
        });

    const changePwdMutation = api.user.changePassword.useMutation({
        onSuccess() {
            setChanging(false);
            setShowChangePwdDialog(false);
            setOldPassword('');
            setNewPassword('');
            setChangePwdError(null);
            showSuccessToast('密码修改成功，请使用新密码登录！');
            // 可以选择执行登出操作
            logout().then(() => router.replace('/login'));
        },
        onError(err: any) {
            setChanging(false);
            setChangePwdError(err?.message || '修改失败');
        },
    });

    const handleChangePwd = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangePwdError(null);

        if (!oldPassword || !newPassword) {
            setChangePwdError('请输入完整信息');
            return;
        }
        if (newPassword.length < 8) {
            setChangePwdError('新密码至少8位');
            return;
        }
        setChanging(true);

        changePwdMutation.mutate({
            oldPassword,
            newPassword,
        });
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (session && statsLoading) {
        return <ContentLoading text="个人信息加载中..." />;
    }

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
                    {session ? (
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
                            <Box color="red" textDecoration="underline">
                                {session?.user?.role === ROLES.SUPERADMIN ? (
                                    <Link href="/admin">管理入口</Link>
                                ) : session?.user?.role === ROLES.VENDOR ? (
                                    <Link href="/vendor">管理入口</Link>
                                ) : null}
                            </Box>
                        </Flex>
                    ) : (
                        <Flex
                            align="center"
                            gap={3}
                            cursor="pointer"
                            onClick={() => router.push('/login')}
                        >
                            <Avatar.Root>
                                <Avatar.Fallback name="N" />
                            </Avatar.Root>
                            <Box>
                                <Text fontWeight="bold" fontSize="md">
                                    点击登录账户
                                </Text>
                            </Box>
                        </Flex>
                    )}
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
                <Grid templateColumns="repeat(4, 1fr)" gap={2} mt={4}>
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
                    {/* <Link href="/full/order?status=CANCELLED">
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
                    </Link> */}
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

            {/* 修改密码按钮 - 只在登录状态下显示，放在退出登录上面 */}
            {session && (
                <Box
                    bg="white"
                    mx={4}
                    borderRadius="xl"
                    p={4}
                    mb={2}
                    boxShadow="2xs"
                >
                    <Button
                        w="100%"
                        colorScheme="blue"
                        variant="outline"
                        mb={0}
                        onClick={() => setShowChangePwdDialog(true)}
                    >
                        <FiLock />
                        修改密码
                    </Button>
                </Box>
            )}

            {/* 退出登录按钮 - 只在登录状态下显示 */}
            {session && (
                <Box
                    bg="white"
                    mx={4}
                    borderRadius="xl"
                    p={4}
                    mb={4}
                    boxShadow="2xs"
                >
                    <Button
                        w="100%"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => setShowLogoutDialog(true)}
                    >
                        <FiLogOut />
                        退出登录
                    </Button>
                </Box>
            )}

            {/* 修改密码对话框 */}
            {session && (
                <DialogRoot
                    open={showChangePwdDialog}
                    onOpenChange={(e) => setShowChangePwdDialog(e.open)}
                >
                    <DialogContent as="form" onSubmit={handleChangePwd}>
                        <DialogHeader>
                            <DialogTitle>修改密码</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Box mb={3}>
                                <Text fontWeight="bold" mb={1}>
                                    原始密码
                                </Text>
                                <Input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) =>
                                        setOldPassword(e.target.value)
                                    }
                                    placeholder="请输入原始密码"
                                    autoComplete="current-password"
                                    mb={2}
                                />
                                <Text fontWeight="bold" mb={1}>
                                    新密码
                                </Text>
                                <Input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    placeholder="请输入新密码（至少8位）"
                                    autoComplete="new-password"
                                    mb={1}
                                />
                                {changePwdError && (
                                    <Text color="red.500" fontSize="sm" mt={2}>
                                        {changePwdError}
                                    </Text>
                                )}
                            </Box>
                        </DialogBody>
                        <DialogFooter>
                            <Button
                                colorScheme="blue"
                                type="submit"
                                loading={changing}
                                disabled={changing}
                            >
                                确认修改
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </DialogContent>
                </DialogRoot>
            )}

            {/* 退出登录确认对话框 - 只在登录状态下显示 */}
            {session && (
                <DialogRoot
                    open={showLogoutDialog}
                    onOpenChange={(e) => setShowLogoutDialog(e.open)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>确认退出</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            您确定要退出登录吗？退出后需要重新登录才能使用完整功能。
                        </DialogBody>
                        <DialogFooter>
                            <Button colorScheme="red" onClick={handleLogout}>
                                确认退出
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </DialogContent>
                </DialogRoot>
            )}
        </Box>
    );
}
