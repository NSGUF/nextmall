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
import DataTable from '../_components/DataTable';
import { api } from '@/trpc/react';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { ContentLoading } from '@/app/_components/LoadingSpinner';
import ImageUpload from '../_components/ImageUpload';

// react-hook-form
type Category = {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    createdAt: Date;
    updatedAt: Date;
};
type CategoryForm = Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & {
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
        data: categoryResponse,
        refetch,
        isLoading,
    } = api.category.list.useQuery({
        ...(orderBy ? { orderBy, order } : {}),
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    });

    const categories = categoryResponse?.data ?? [];
    const pageCount = categoryResponse?.pagination?.totalPages ?? 0;

    // 分页回调函数
    const handlePaginationChange = (newPagination: {
        pageIndex: number;
        pageSize: number;
    }) => {
        setPagination(newPagination);
    };
    const createCategory = api.category.create.useMutation({
        onSuccess: () => refetch(),
    });
    const updateCategory = api.category.update.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteCategory = api.category.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteMany = api.category.deleteMany.useMutation({
        onSuccess: () => refetch(),
    });

    // 新增/编辑弹窗
    const [editing, setEditing] = useState<Category | null>(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<CategoryForm>({
        defaultValues: { name: '', description: '', icon: '' },
    });

    const openEdit = (category?: any) => {
        setEditing(category ?? null);
        if (category) {
            reset({
                name: category.name ?? '',
                description: category.description ?? '',
                icon: category.icon ?? '',
            });
        } else {
            reset({ name: '', description: '', icon: '' });
        }
        onOpen();
    };

    const onSubmit = async (data: CategoryForm) => {
        // Ensure no nulls for string fields
        const payload = {
            ...data,
            name: data.name ?? '',
            description: data.description ?? '',
            icon: data.icon ?? '',
        };
        if (editing) {
            await updateCategory.mutateAsync({ ...payload, id: editing.id });
        } else {
            await createCategory.mutateAsync(payload);
        }
        onClose();
    };

    // 批量删除
    const handleBulkDelete = async (rows: any[]) => {
        if (!rows.length) return;
        await deleteMany.mutateAsync({ ids: rows.map((r) => r.id) });
    };
    const handleDelete = async (id: string) => {
        await deleteCategory.mutateAsync({ id });
    };

    // 删除确认弹窗
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该分类吗？',
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
        content: `确定要删除选中的 ${bulkDeleteRows.length} 个分类吗？此操作不可撤销。`,
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
            { accessorKey: 'name', header: '名称', width: 150 },
            { accessorKey: 'description', header: '描述', width: 200 },
            {
                accessorKey: 'icon',
                header: '图标',
                width: 120,
                cell: ({ row }: { row: any }) =>
                    row.original.icon ? (
                        <img
                            src={row.original.icon}
                            alt="icon"
                            style={{
                                width: 32,
                                height: 32,
                                objectFit: 'cover',
                            }}
                        />
                    ) : null,
            },
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
                cell: ({ row }: { row: { original: Category } }) => (
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
        return categories.map((c) => ({
            ...c,
            name: c.name ?? '',
            description: c.description ?? '',
            icon: c.icon ?? '',
        })) as any;
    }, [categories]);

    if (isLoading) {
        return (
            <Box
                borderRadius="lg"
                minHeight="full"
                p={4}
                bg="white"
                boxShadow="xs"
            >
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={4}
                >
                    <Heading size="lg">分类管理</Heading>
                </Box>
                <ContentLoading text="分类数据加载中..." />
            </Box>
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
                <Heading size="lg">分类管理</Heading>
            </Box>
            <DataTable
                columns={columns.map((col) =>
                    col.id === 'action'
                        ? {
                              ...col,
                              cell: ({
                                  row,
                              }: {
                                  row: { original: Category };
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
                            {editing ? '编辑' : '新增'}分类
                        </Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Field.Root invalid={!!errors.name}>
                                    <Field.Label>名称</Field.Label>
                                    <Input
                                        placeholder="名称"
                                        {...register('name', {
                                            required: '请输入名称',
                                            minLength: {
                                                value: 2,
                                                message: '名称至少需要2个字符',
                                            },
                                            maxLength: {
                                                value: 20,
                                                message: '名称不能超过20个字符',
                                            },
                                        })}
                                    />
                                    {errors.name && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.name.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root invalid={!!errors.description}>
                                    <Field.Label>描述</Field.Label>
                                    <Input
                                        placeholder="描述（可选）"
                                        {...register('description', {
                                            maxLength: {
                                                value: 100,
                                                message:
                                                    '描述不能超过100个字符',
                                            },
                                        })}
                                    />
                                    {errors.description && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.description.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root invalid={!!errors.icon}>
                                    <Field.Label>图标</Field.Label>
                                    <Controller
                                        name="icon"
                                        control={control}
                                        rules={{ required: '请上传图标' }}
                                        render={({ field }) => (
                                            <ImageUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                folder="categories"
                                                placeholder="点击上传分类图标"
                                            />
                                        )}
                                    />
                                    {errors.icon && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.icon.message}
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
