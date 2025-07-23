'use client';
import TopNav from '../_components/TopNav';
import ProductItem from '@/app/h5/_components/ProductItem';
import { api } from '@/trpc/react';
import { Box, Center, Spinner, VStack, EmptyState } from '@chakra-ui/react';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { useState } from 'react';

export default function FootprintPage() {
    const {
        data: footprints = [],
        refetch,
        isLoading,
    } = api.product.getFootprints.useQuery(undefined, {
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
        staleTime: 0,
        gcTime: 0,
    });
    const deleteFootprint = api.product.deleteFootprint.useMutation({
        onSuccess: () => refetch(),
    });

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { ConfirmDialog: DeleteConfirmDialog, open: openDeleteConfirm } =
        useConfirmDialog({
            title: '确认删除',
            content: '确定要删除该足迹吗？',
            confirmText: '删除',
            cancelText: '取消',
            buttonProps: { style: { display: 'none' } },
            onConfirm: async () => {
                if (deleteId) {
                    await deleteFootprint.mutateAsync({ id: deleteId });
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
                <TopNav title="我的足迹" />
                <Center h="50vh">
                    <Spinner size="lg" color="red.500" />
                </Center>
            </>
        );
    }

    return (
        <>
            <TopNav />
            <Box p={2}>
                {footprints.length > 0 ? (
                    <ProductItem
                        products={footprints}
                        isShowDelete
                        onDelete={handleDeleteWithConfirm}
                    />
                ) : (
                    <Center h="90vh">
                        <EmptyState.Root>
                            <EmptyState.Content>
                                <VStack textAlign="center">
                                    <EmptyState.Title>
                                        暂无足迹
                                    </EmptyState.Title>
                                    <EmptyState.Description>
                                        快去浏览你喜欢的商品吧
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
