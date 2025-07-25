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
type Banner = {
    id: string;
    title: string;
    image: string;
    isActive: boolean;
    sort: number;
    link: string;
    createdAt: Date;
    updatedAt: Date;
};
type BannerForm = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'> & {
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
        data: bannerResponse,
        refetch,
        isLoading,
    } = api.banner.list.useQuery({
        ...(orderBy ? { orderBy, order } : {}),
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    });

    const banners = bannerResponse?.data ?? [];
    const pageCount = bannerResponse?.pagination?.totalPages ?? 0;

    // 分页回调函数
    const handlePaginationChange = (newPagination: {
        pageIndex: number;
        pageSize: number;
    }) => {
        setPagination(newPagination);
    };
    const createBanner = api.banner.create.useMutation({
        onSuccess: () => refetch(),
    });
    const updateBanner = api.banner.update.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteBanner = api.banner.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteMany = api.banner.deleteMany.useMutation({
        onSuccess: () => refetch(),
    });

    // 新增/编辑弹窗
    const [editing, setEditing] = useState<Banner | null>(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<BannerForm>({
        defaultValues: {
            title: '',
            image: '',
            isActive: true,
            sort: 0,
            link: '',
        },
    });

    const openEdit = (banner?: any) => {
        setEditing(banner ?? null);
        if (banner) {
            reset({
                title: banner.title ?? '',
                image: banner.image ?? '',
                isActive: banner.isActive ?? true,
                sort: banner.sort ?? 0,
                link: banner.link ?? '',
            });
        } else {
            reset({
                title: '',
                image: '',
                isActive: true,
                sort: 0,
                link: '',
            });
        }
        onOpen();
    };

    const onSubmit = async (data: BannerForm) => {
        // Ensure no nulls for string fields
        const payload = {
            ...data,
            title: data.title ?? '',
            image: data.image ?? '',
            link: data.link ?? '',
        };
        if (editing) {
            await updateBanner.mutateAsync({ ...payload, id: editing.id });
        } else {
            await createBanner.mutateAsync(payload);
        }
        onClose();
    };

    // 批量删除
    const handleBulkDelete = async (rows: any[]) => {
        if (!rows.length) return;
        await deleteMany.mutateAsync({ ids: rows.map((r) => r.id) });
    };
    const handleDelete = async (id: string) => {
        await deleteBanner.mutateAsync({ id });
    };

    // 删除确认弹窗
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该Banner吗？',
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
        content: `确定要删除选中的 ${bulkDeleteRows.length} 个Banner吗？此操作不可撤销。`,
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
                accessorKey: 'image',
                header: '图片',
                width: 150,
                cell: ({ row }: { row: any }) => (
                    <img
                        src={row.original.image}
                        alt=""
                        style={{ width: 50, height: 30, objectFit: 'cover' }}
                    />
                ),
            },
            {
                accessorKey: 'isActive',
                header: '是否启用',
                width: 100,
                cell: ({ row }: { row: any }) =>
                    row.original.isActive ? '是' : '否',
            },
            { accessorKey: '跳转连接', header: '跳转链接', width: 80 },
            { accessorKey: 'sort', header: '排序', width: 80 },
            {
                id: 'action',
                header: '操作',
                width: 180,
                cell: ({ row }: { row: { original: Banner } }) => (
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
        return banners;
    }, [banners]);

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
                    <Heading size="lg">banner管理</Heading>
                </Box>
                <ContentLoading text="Banner数据加载中..." />
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
                <Heading size="lg">banner管理</Heading>
            </Box>
            <DataTable
                columns={columns.map((col) =>
                    col.id === 'action'
                        ? {
                              ...col,
                              cell: ({
                                  row,
                              }: {
                                  row: { original: Banner };
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
                            {editing ? '编辑' : '新增'}Banner
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
                                <Field.Root invalid={!!errors.image}>
                                    <Field.Label>图片</Field.Label>
                                    <Controller
                                        name="image"
                                        control={control}
                                        rules={{ required: '请上传图片' }}
                                        render={({ field }) => (
                                            <ImageUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                folder="banners"
                                                placeholder="点击上传Banner图片"
                                            />
                                        )}
                                    />
                                    {errors.image && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.image.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>是否启用</Field.Label>
                                    <Controller
                                        name="isActive"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <Switch.Root
                                                    name={field.name}
                                                    checked={field.value}
                                                    onCheckedChange={({
                                                        checked,
                                                    }) =>
                                                        field.onChange(checked)
                                                    }
                                                >
                                                    <Switch.HiddenInput
                                                        onBlur={field.onBlur}
                                                    />
                                                    <Switch.Control>
                                                        <Switch.Thumb />
                                                    </Switch.Control>
                                                    <Switch.Label />
                                                </Switch.Root>
                                                {/* 可选：错误提示 */}
                                                {/* <Field.ErrorText>{errors.isActive?.message}</Field.ErrorText> */}
                                            </>
                                        )}
                                    />
                                </Field.Root>
                                <Field.Root invalid={!!errors.sort}>
                                    <Field.Label>排序</Field.Label>
                                    <Input
                                        placeholder="排序（数字越小越靠前）"
                                        type="number"
                                        {...register('sort', {
                                            valueAsNumber: true,
                                            min: {
                                                value: 0,
                                                message: '排序值不能小于0',
                                            },
                                            max: {
                                                value: 9999,
                                                message: '排序值不能大于9999',
                                            },
                                        })}
                                    />
                                    {errors.sort && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.sort.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root invalid={!!errors.link}>
                                    <Field.Label>跳转链接</Field.Label>
                                    <Input
                                        placeholder="跳转链接（可选）"
                                        {...register('link', {
                                            pattern: {
                                                value: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
                                                message: '请输入有效的链接地址',
                                            },
                                        })}
                                    />
                                    {errors.link && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.link.message}
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
