'use client';
import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Heading,
    Wrap,
    useDisclosure,
    Text,
    Input,
    Switch,
    Stack,
    Field,
} from '@chakra-ui/react';
import DataTable from '../../_components/DataTable';
import { api } from '@/trpc/react';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';

// Collection 类型
type Collection = {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
};
type CollectionForm = Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
};
export default function AdminPage() {
    // tRPC hooks
    // 排序 state
    const [sorting, setSorting] = useState<any[]>([]);
    const orderBy = sorting[0]?.id;
    const order = sorting[0]?.desc ? 'desc' : 'asc';

    // 分页 state
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const {
        data: collectionResponse,
        refetch,
        isLoading,
    } = api.collection.list.useQuery({
        ...(orderBy ? { orderBy, order } : {}),
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    });

    const collections = collectionResponse?.data ?? [];
    const pageCount = collectionResponse?.pagination?.totalPages ?? 0;

    // 分页回调函数
    const handlePaginationChange = (newPagination: {
        pageIndex: number;
        pageSize: number;
    }) => {
        setPagination(newPagination);
    };
    const createCollection = api.collection.create.useMutation({
        onSuccess: () => refetch(),
    });
    const updateCollection = api.collection.update.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteCollection = api.collection.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteMany = api.collection.deleteMany.useMutation({
        onSuccess: () => refetch(),
    });

    // 新增/编辑弹窗
    const [editing, setEditing] = useState<Collection | null>(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<CollectionForm>({
        defaultValues: { title: '' },
    });

    const openEdit = (collection?: any) => {
        setEditing(collection ?? null);
        if (collection) {
            reset({
                title: collection.title ?? '',
            });
        } else {
            reset({ title: '' });
        }
        onOpen();
    };

    const onSubmit = async (data: CollectionForm) => {
        const payload = {
            ...data,
            title: data.title ?? '',
        };
        if (editing) {
            await updateCollection.mutateAsync({ ...payload, id: editing.id });
        } else {
            await createCollection.mutateAsync(payload);
        }
        onClose();
    };

    // 批量删除
    const handleBulkDelete = async (rows: any[]) => {
        if (!rows.length) return;
        await deleteMany.mutateAsync({ ids: rows.map((r) => r.id) });
    };
    const handleDelete = async (id: string) => {
        await deleteCollection.mutateAsync({ id });
    };

    // 删除确认弹窗
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该Collection吗？',
        confirmText: '删除',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
        onConfirm: async () => {
            if (deleteId) {
                await handleDelete(deleteId);
                setDeleteId(null);
            }
        },
        onCancel: () => setDeleteId(null),
    });

    const handleDeleteWithConfirm = (id: string) => {
        setDeleteId(id);
        openDeleteConfirm();
    };

    // 批量删除确认弹窗
    const [bulkDeleteRows, setBulkDeleteRows] = useState<any[]>([]);
    const {
        ConfirmDialog: BulkDeleteConfirmDialog,
        open: openBulkDeleteConfirm,
        close: closeBulkDeleteConfirm,
    } = useConfirmDialog({
        title: '确认批量删除',
        content: `确定要删除选中的 ${bulkDeleteRows.length} 个Collection吗？此操作不可撤销。`,
        confirmText: '删除',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
        onConfirm: async () => {
            if (bulkDeleteRows.length > 0) {
                await handleBulkDelete(bulkDeleteRows);
                setBulkDeleteRows([]);
            }
        },
        onCancel: () => setBulkDeleteRows([]),
    });

    const handleBulkDeleteWithConfirm = (rows: any[]) => {
        setBulkDeleteRows(rows);
        openBulkDeleteConfirm();
    };

    const columns = useMemo(
        () => [
            { accessorKey: 'title', header: '标题', width: 150 },
            {
                accessorKey: 'createdAt',
                header: '创建时间',
                width: 180,
                cell: ({ row }: { row: any }) =>
                    new Date(row.original.createdAt).toLocaleString(),
            },
            {
                accessorKey: 'updatedAt',
                header: '更新时间',
                width: 180,
                cell: ({ row }: { row: any }) =>
                    new Date(row.original.updatedAt).toLocaleString(),
            },
            {
                id: 'action',
                header: '操作',
                width: 180,
                cell: ({ row }: { row: { original: Collection } }) => (
                    <Wrap gap={1} flexWrap="nowrap">
                        <Button
                            size="2xs"
                            colorScheme="blue"
                            onClick={() => openEdit(row.original)}
                        >
                            编辑
                        </Button>
                        <Button
                            size="2xs"
                            colorScheme="red"
                            onClick={() =>
                                handleDeleteWithConfirm(row.original.id)
                            }
                        >
                            删除
                        </Button>
                    </Wrap>
                ),
            },
        ],
        [openEdit]
    );

    // Memoize the data to avoid unnecessary re-renders
    const memoizedData = useMemo(() => {
        return collections as any;
    }, [collections]);

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Heading size="lg">课程分类管理</Heading>
            </Box>
            <DataTable
                columns={columns.map((col) =>
                    col.id === 'action'
                        ? {
                              ...col,
                              cell: ({
                                  row,
                              }: {
                                  row: { original: Collection };
                              }) => (
                                  <Wrap gap={1} flexWrap="nowrap">
                                      <Button
                                          size="2xs"
                                          colorScheme="blue"
                                          onClick={() => openEdit(row.original)}
                                      >
                                          编辑
                                      </Button>
                                      <Button
                                          size="2xs"
                                          colorScheme="red"
                                          onClick={() =>
                                              handleDeleteWithConfirm(
                                                  row.original.id
                                              )
                                          }
                                      >
                                          删除
                                      </Button>
                                  </Wrap>
                              ),
                          }
                        : col
                )}
                data={memoizedData}
                selectable
                manualSorting
                onSortingChange={setSorting}
                manualPagination
                pageCount={pageCount}
                onPaginationChange={handlePaginationChange}
                renderBulkActions={(rows) => {
                    const hasSelection = rows.length > 0;
                    return (
                        <>
                            <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() =>
                                    handleBulkDeleteWithConfirm(rows)
                                }
                                disabled={!hasSelection}
                            >
                                批量删除
                            </Button>
                            <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => openEdit()}
                            >
                                新增
                            </Button>
                        </>
                    );
                }}
            />

            {/* 新增/编辑弹窗 */}
            {isOpen && (
                <Box
                    position="fixed"
                    left={0}
                    top={0}
                    w="100vw"
                    h="100vh"
                    bg="blackAlpha.400"
                    zIndex={1000}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box bg="white" p={6} borderRadius="md" minW={400}>
                        <Heading size="md" mb={4}>
                            {editing ? '编辑' : '新增'}Collection
                        </Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Field.Root invalid={!!errors.title}>
                                    <Field.Label>标题</Field.Label>
                                    <Input
                                        placeholder="标题"
                                        {...register('title', {
                                            required: '请输入标题',
                                            minLength: {
                                                value: 2,
                                                message: '标题至少需要2个字符',
                                            },
                                            maxLength: {
                                                value: 50,
                                                message: '标题不能超过50个字符',
                                            },
                                        })}
                                    />
                                    {errors.title && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.title.message}
                                        </Text>
                                    )}
                                </Field.Root>
                            </Stack>
                            <Box
                                display="flex"
                                justifyContent="flex-end"
                                gap={2}
                                mt={4}
                            >
                                <Button onClick={onClose} type="button">
                                    取消
                                </Button>
                                <Button
                                    colorScheme="blue"
                                    type="submit"
                                    loading={isSubmitting}
                                >
                                    保存
                                </Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            )}
            {DeleteConfirmDialog}
            {BulkDeleteConfirmDialog}
        </Box>
    );
}
