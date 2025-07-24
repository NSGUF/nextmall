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

// react-hook-form
type Banner = {
    id: string;
    title: string;
    description: string;
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
    const {
        data: banners = [],
        refetch,
        isLoading,
    } = api.banner.list.useQuery(orderBy ? { orderBy, order } : undefined);
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
            description: '',
            sort: 0,
            link: '',
        },
    });

    const openEdit = (banner?: any) => {
        setEditing(banner ?? null);
        if (banner) {
            reset({
                title: banner.title ?? '',
                description: banner.description ?? '',
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
                description: '',
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
            description: data.description ?? '',
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

    const columns = useMemo(
        () => [
            { accessorKey: 'title', header: '标题', width: 150 },
            { accessorKey: 'description', header: '描述', width: 150 },
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
                renderBulkActions={(rows) => {
                    const hasSelection = rows.length > 0;
                    return (
                        <>
                            <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleBulkDelete(rows)}
                                disabled={!hasSelection}
                            >
                                批量删除
                            </Button>
                            <Button
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
                                        })}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>描述</Field.Label>
                                    <Input
                                        placeholder="描述"
                                        {...register('description')}
                                    />
                                </Field.Root>
                                <Field.Root invalid={!!errors.image}>
                                    <Field.Label>图片URL</Field.Label>
                                    <Input
                                        placeholder="图片URL"
                                        {...register('image', {
                                            required: '请输入图片URL',
                                        })}
                                    />
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
                                <Field.Root>
                                    <Field.Label>排序</Field.Label>
                                    <Input
                                        placeholder="排序"
                                        type="number"
                                        {...register('sort', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>跳转链接</Field.Label>
                                    <Input
                                        placeholder="跳转链接"
                                        {...register('link')}
                                    />
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
        </Box>
    );
}
