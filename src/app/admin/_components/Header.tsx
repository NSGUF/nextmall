'use client';
import { Box, IconButton, Wrap, Avatar, Flex } from '@chakra-ui/react';
import {
    FiBell,
    FiCalendar,
    FiMenu,
    FiList,
    FiLogOut,
    FiUser,
} from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import {
    MenuRoot,
    MenuTrigger,
    MenuContent,
    MenuItem,
    MenuSeparator,
} from '@/app/_components/ui/menu';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
} from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/app/const/status';

const Header = () => {
    const { data: session } = useSession();
    const { logout } = useAuth();
    const router = useRouter();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const userName = session?.user?.name ?? session?.user?.phone ?? '用户';
    const userRole = session?.user?.role;

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    return (
        <Box
            borderBottomWidth="1px"
            px={3}
            h="54px"
            bg="white"
            _dark={{ bg: 'black' }}
            backdropFilter="blur(2px)"
        >
            <Flex justifyContent="flex-end" alignItems="center" h="full">
                {/* <IconButton
                    aria-label="Menu"
                    variant="ghost"
                    fontSize="xl"
                    rounded="full"
                >
                    <FiMenu />
                </IconButton> */}

                <Wrap gap={0} alignItems="center">
                    {/* <IconButton
                        aria-label="Notifications"
                        title="Notifications"
                        variant="ghost"
                        rounded="full"
                        color="gray.600"
                        _dark={{ color: 'initial' }}
                    >
                        <FiBell size={24} color="#1e40af" />
                    </IconButton>
                    <IconButton
                        aria-label="Reminder"
                        title="Reminder"
                        variant="ghost"
                        rounded="full"
                        color="gray.600"
                        _dark={{ color: 'initial' }}
                    >
                        <FiCalendar size={21} />
                    </IconButton>
                    <IconButton
                        aria-label="Tasks"
                        title="Tasks"
                        variant="ghost"
                        rounded="full"
                        color="gray.600"
                        _dark={{ color: 'initial' }}
                    >
                        <FiList size={21} />
                    </IconButton> */}
                    <MenuRoot>
                        <MenuTrigger asChild>
                            <Box cursor="pointer">
                                <Avatar.Root>
                                    <Avatar.Fallback name={userName} />
                                </Avatar.Root>
                            </Box>
                        </MenuTrigger>
                        <MenuContent>
                            <MenuItem value="profile" disabled>
                                <FiUser />
                                {userName}
                                {userRole && (
                                    <Box
                                        ml={2}
                                        px={2}
                                        py={1}
                                        bg="blue.100"
                                        color="blue.800"
                                        fontSize="xs"
                                        borderRadius="md"
                                    >
                                        {userRole === ROLES.SUPERADMIN
                                            ? '管理员'
                                            : userRole === ROLES.VENDOR
                                              ? '供应商'
                                              : userRole}
                                    </Box>
                                )}
                            </MenuItem>
                            <MenuSeparator />
                            <MenuItem
                                value="logout"
                                color="red.600"
                                cursor="pointer"
                                onClick={() => setShowLogoutDialog(true)}
                            >
                                <FiLogOut />
                                退出登录
                            </MenuItem>
                        </MenuContent>
                    </MenuRoot>
                </Wrap>
            </Flex>

            {/* 退出登录确认对话框 */}
            <DialogRoot
                open={showLogoutDialog}
                onOpenChange={(e) => setShowLogoutDialog(e.open)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认退出</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        您确定要退出登录吗？退出后需要重新登录才能访问管理后台。
                    </DialogBody>
                    <DialogFooter>
                        <Button colorScheme="red" onClick={handleLogout}>
                            确认退出
                        </Button>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>
        </Box>
    );
};

export default Header;
