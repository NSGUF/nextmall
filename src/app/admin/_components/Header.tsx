'use client';
import { Box, IconButton, Wrap, Avatar, Flex } from '@chakra-ui/react';
import {
    FiBell,
    FiCalendar,
    FiMenu,
    FiList,
    FiLogOut,
    FiUser,
    FiX,
} from 'react-icons/fi';
import { useSession } from 'next-auth/react';
import { useState, useContext } from 'react';
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
import { SidebarContext } from '@/app/admin/_components/SidebarContext';

const Header = () => {
    const { data: session } = useSession();
    const { logout } = useAuth();
    const router = useRouter();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const { sidebarOpen, setSidebarOpen } = useContext(SidebarContext);

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
            <Flex justifyContent="space-between" alignItems="center" h="full">
                <IconButton
                    aria-label="Toggle menu"
                    variant="ghost"
                    fontSize="xl"
                    rounded="full"
                    display={{ base: 'flex', md: 'none' }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <FiX /> : <FiMenu />}
                </IconButton>

                <Wrap gap={0} alignItems="center">
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
