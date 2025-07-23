'use client';

import React from 'react';
import Image from 'next/image';
import { trpc } from '@/app/_components/trpc';
import { Button } from '@/app/_components/ui/button';
import TopNav from '../_components/TopNav';
import {
    Box,
    Flex,
    Text,
    EmptyState,
    VStack,
    Separator,
} from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { useRouter } from 'next/navigation';

export default function AddressPage() {
    // 获取地址列表
    const {
        data: addresses,
        isLoading,
        refetch,
    } = api.address.list.useQuery(undefined, {
        refetchOnWindowFocus: true,
    });
    const deleteAddress = api.address.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该地址吗？',
        confirmText: '删除',
        cancelText: '取消',
        onConfirm: async () => {
            if (deleteId) {
                await deleteAddress.mutateAsync({ id: deleteId });
                setDeleteId(null);
            }
        },
        onCancel: () => setDeleteId(null),
    });

    const router = useRouter();

    // 空状态
    if (isLoading) {
        return (
            <Box textAlign="center" mt={24}>
                加载中...
            </Box>
        );
    }

    const onBackMe = () => {
        router.push('/h5/me');
    };
    return (
        <>
            <TopNav onBack={onBackMe} />
            <Box minH="100vh" bg="#f4f4f4" pb={20}>
                {!addresses || addresses.length === 0 ? (
                    <EmptyState.Root pt={64}>
                        <EmptyState.Content>
                            <EmptyState.Indicator>
                                <FiAlertCircle />
                            </EmptyState.Indicator>
                            <VStack textAlign="center">
                                <EmptyState.Title>
                                    您还没有地址噢
                                </EmptyState.Title>
                            </VStack>
                        </EmptyState.Content>
                    </EmptyState.Root>
                ) : (
                    <Box p={4}>
                        {addresses.map((addr) => (
                            <Box
                                key={addr.id}
                                bg="#fff"
                                borderRadius={16}
                                mb={2}
                                p={4}
                                boxShadow="0 2px 8px #eee"
                            >
                                <Text fontWeight={600} fontSize="sm">
                                    {addr.province.split('/')?.[1]}{' '}
                                    {addr.city.split('/')?.[1]}{' '}
                                    {addr.district.split('/')?.[1]}
                                </Text>
                                <Text fontWeight={700} fontSize="md" my={0}>
                                    {addr.detail}
                                </Text>
                                <Text color="#888" fontSize="sm">
                                    {addr.name}　{addr.phone}
                                </Text>
                                <Separator my={2} />
                                <Flex align="center" justify="space-between">
                                    <Flex align="center">
                                        <Text
                                            color={
                                                addr.isDefault
                                                    ? 'red.600'
                                                    : 'gray.500'
                                            }
                                            fontSize="sm"
                                        >
                                            {addr.isDefault ? '已设为默认' : ''}
                                        </Text>
                                    </Flex>
                                    <Flex>
                                        <Button
                                            variant="ghost"
                                            h="14px"
                                            size="sm"
                                            mr={2}
                                            onClick={() => {
                                                setDeleteId(addr.id);
                                                openDeleteConfirm();
                                            }}
                                        >
                                            删除
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            h="14px"
                                            size="sm"
                                            color="gray.600"
                                            onClick={() =>
                                                router.push(
                                                    `/full/address/add?id=${addr.id}`
                                                )
                                            }
                                        >
                                            修改
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* 新增地址按钮 */}
                <Box
                    position="fixed"
                    left={0}
                    right={0}
                    bottom={0}
                    bg="transparent"
                    zIndex={10}
                    p={4}
                >
                    <Link href="/full/address/add">
                        <Button
                            w="100%"
                            borderRadius="md"
                            bg="#fa2222"
                            color="#fff"
                            size="xl"
                        >
                            新增地址
                        </Button>
                    </Link>
                </Box>
            </Box>
            {DeleteConfirmDialog}
        </>
    );
}
