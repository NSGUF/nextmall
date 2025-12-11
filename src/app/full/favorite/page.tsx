'use client';
import TopNav from '../_components/TopNav';
import ProductItem from '@/app/h5/_components/ProductItem';
import { api } from '@/trpc/react';
import { Box, Center, Spinner, VStack, EmptyState } from '@chakra-ui/react';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { useState } from 'react';
import { FiHeart } from 'react-icons/fi';

export default function FavoritePage() {
    const {
        data: favorites = [],
        refetch,
        isLoading,
    } = api.product.getFavorites.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 0,
        gcTime: 0,
    });
    const deleteFavorite = api.product.deleteFavorite.useMutation({
        onSuccess: () => refetch(),
    });

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { ConfirmDialog: DeleteConfirmDialog, open: openDeleteConfirm } =
        useConfirmDialog({
            title: '确认删除',
            content: '确定要删除该收藏吗？',
            confirmText: '删除',
            cancelText: '取消',
            buttonProps: { style: { display: 'none' } },
            onConfirm: async () => {
                if (deleteId) {
                    await deleteFavorite.mutateAsync({ id: deleteId });
                    setDeleteId(null);
                }
            },
            onCancel: () => setDeleteId(null),
        });

    const handleDeleteWithConfirm = (id: string) => {
        setDeleteId(id);
        openDeleteConfirm();
    };

    if (isLoading) {
        return (
            <>
                <TopNav title="我的收藏" />
                <Center h="50vh">
                    <Spinner size="lg" color="red.500" />
                </Center>
            </>
        );
    }

    return (
        <>
            <TopNav title="我的收藏" />
            <Box p={2}>
                {favorites.length > 0 ? (
                    <ProductItem
                        products={favorites}
                        isShowDelete
                        onDelete={handleDeleteWithConfirm}
                    />
                ) : (
                    <Center h="90vh">
                        <EmptyState.Root>
                            <EmptyState.Content>
                                <VStack textAlign="center">
                                    <EmptyState.Title>
                                        暂无收藏
                                    </EmptyState.Title>
                                    <EmptyState.Description>
                                        快去收藏你喜欢的商品吧
                                    </EmptyState.Description>
                                </VStack>
                            </EmptyState.Content>
                        </EmptyState.Root>
                    </Center>
                )}
            </Box>
            {DeleteConfirmDialog}
        </>
    );
}
