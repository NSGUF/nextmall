'use client';
import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Heading,
    Wrap,
    useDisclosure,
    NativeSelect,
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

// Course 类型
type Course = {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    coverImage?: string;
    duration: number;
    views: number;
    creatorId: string;
    publishedAt?: Date;
    isPublished: boolean;
    collectionId?: string;
    tags: string[];
    isFree: boolean;
    price?: number;
    order?: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
};
type CourseForm = Omit<
    Course,
    'id' | 'createdAt' | 'updatedAt' | 'views' | 'isDeleted'
> & { id?: string };

export default function AdminPage() {
    // tRPC hooks
    // 排序 state
    const [sorting, setSorting] = useState<any[]>([]);
    const orderBy = sorting[0]?.id;
    const order = sorting[0]?.desc ? 'desc' : 'asc';
    const {
        data: courses = [],
        refetch,
        isLoading,
    } = api.course.list.useQuery(orderBy ? { orderBy, order } : undefined);
    const createCourse = api.course.create.useMutation({
        onSuccess: () => refetch(),
    });
    const updateCourse = api.course.update.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteCourse = api.course.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteMany = api.course.deleteMany.useMutation({
        onSuccess: () => refetch(),
    });

    // 获取分类列表用于下拉
    const { data: collections = [] } = api.collection.list.useQuery();

    // 新增/编辑弹窗
    const [editing, setEditing] = useState<Course | null>(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<CourseForm>({
        defaultValues: {
            title: '',
            description: '',
            videoUrl: '',
            coverImage: '',
            duration: 0,
            creatorId: '',
            isPublished: false,
            collectionId: undefined,
            tags: [],
            isFree: true,
            price: undefined,
            order: undefined,
        },
    });

    const openEdit = (course?: any) => {
        setEditing(course ?? null);
        if (course) {
            reset({
                title: course.title ?? '',
                description: course.description ?? '',
                videoUrl: course.videoUrl ?? '',
                coverImage: course.coverImage ?? '',
                duration: course.duration ?? 0,
                creatorId: course.creatorId ?? '',
                isPublished: course.isPublished ?? false,
                collectionId: course.collectionId ?? undefined,
                tags: course.tags ?? [],
                isFree: course.isFree ?? true,
                price: course.price ?? undefined,
                order: course.order ?? undefined,
            });
        } else {
            reset({
                title: '',
                description: '',
                videoUrl: '',
                coverImage: '',
                duration: 0,
                creatorId: '',
                isPublished: false,
                collectionId: undefined,
                tags: [],
                isFree: true,
                price: undefined,
                order: undefined,
            });
        }
        onOpen();
    };

    const onSubmit = async (data: CourseForm) => {
        const payload = {
            ...data,
            title: data.title ?? '',
            description: data.description ?? '',
            videoUrl: data.videoUrl ?? '',
            coverImage: data.coverImage ?? '',
            duration: data.duration ?? 0,
            creatorId: data.creatorId ?? '',
            isPublished: data.isPublished ?? false,
            collectionId: data.collectionId ?? undefined,
            tags: data.tags ?? [],
            isFree: data.isFree ?? true,
            price: data.price ?? undefined,
            order: data.order ?? undefined,
        };
        if (editing) {
            await updateCourse.mutateAsync({ ...payload, id: editing.id });
        } else {
            await createCourse.mutateAsync(payload);
        }
        onClose();
    };

    // 批量删除
    const handleBulkDelete = async (rows: any[]) => {
        if (!rows.length) return;
        await deleteMany.mutateAsync({ ids: rows.map((r) => r.id) });
    };
    const handleDelete = async (id: string) => {
        await deleteCourse.mutateAsync({ id });
    };

    // 删除确认弹窗
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该课程吗？',
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

    // 排序
    // 已由后端排序...

    // Map 产品s to ensure no nulls for string fields before passing to DataTable
    const normalizedCourses: Course[] = useMemo(
        () =>
            courses.map((c) => ({
                ...c,
                title: c.title ?? '',
                description: c.description ?? '',
                videoUrl: c.videoUrl ?? '',
                coverImage: c.coverImage ?? '',
                duration: c.duration ?? 0,
                creatorId: c.creatorId ?? '',
                isPublished: c.isPublished ?? false,
                collectionId: c.collectionId ?? undefined,
                tags: c.tags ?? [],
                isFree: c.isFree ?? true,
                price: c.price ?? undefined,
                order: c.order ?? undefined,
            })),
        [courses]
    );

    const columns = useMemo(
        () => [
            { accessorKey: 'title', header: '标题', width: 150 },
            { accessorKey: 'description', header: '描述', width: 200 },
            { accessorKey: 'videoUrl', header: '视频地址', width: 200 },
            {
                accessorKey: 'coverImage',
                header: '封面图',
                width: 120,
                cell: ({ row }: { row: any }) =>
                    row.original.coverImage ? (
                        <img
                            src={row.original.coverImage}
                            alt="cover"
                            style={{
                                width: 32,
                                height: 32,
                                objectFit: 'cover',
                            }}
                        />
                    ) : null,
            },
            { accessorKey: 'duration', header: '时长(秒)', width: 100 },
            { accessorKey: 'views', header: '播放次数', width: 100 },
            {
                accessorKey: 'isPublished',
                header: '上架',
                width: 80,
                cell: ({ row }: { row: any }) =>
                    row.original.isPublished ? '是' : '否',
            },
            {
                accessorKey: 'isFree',
                header: '免费',
                width: 80,
                cell: ({ row }: { row: any }) =>
                    row.original.isFree ? '是' : '否',
            },
            { accessorKey: 'collectionId', header: '合集ID', width: 120 },
            {
                accessorKey: 'tags',
                header: '标签',
                width: 120,
                cell: ({ row }: { row: any }) => row.original.tags?.join(', '),
            },
            {
                id: 'action',
                header: '操作',
                width: 180,
                cell: ({ row }: { row: { original: Course } }) => (
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

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Heading size="lg">课程管理</Heading>
            </Box>
            <DataTable
                columns={columns.map((col) =>
                    col.id === 'action'
                        ? {
                              ...col,
                              cell: ({
                                  row,
                              }: {
                                  row: { original: Course };
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
                data={useMemo(() => {
                    return courses.map((c) => ({
                        ...c,
                        title: c.title ?? '',
                        description: c.description ?? '',
                        videoUrl: c.videoUrl ?? '',
                        coverImage: c.coverImage ?? '',
                        duration: c.duration ?? 0,
                        creatorId: c.creatorId ?? '',
                        isPublished: c.isPublished ?? false,
                        collectionId: c.collectionId ?? undefined,
                        tags: c.tags ?? [],
                        isFree: c.isFree ?? true,
                        price: c.price ?? undefined,
                        order: c.order ?? undefined,
                    }));
                }, [courses])}
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
                            {editing ? '编辑' : '新增'}课程
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
                                <Field.Root>
                                    <Field.Label>视频地址</Field.Label>
                                    <Input
                                        placeholder="视频地址"
                                        {...register('videoUrl', {
                                            required: '请输入视频地址',
                                        })}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>封面图</Field.Label>
                                    <Input
                                        placeholder="封面图URL"
                                        {...register('coverImage')}
                                    />
                                </Field.Root>
                                <Field.Root invalid={!!errors.duration}>
                                    <Field.Label>时长(秒)</Field.Label>
                                    <Input
                                        placeholder="时长"
                                        type="number"
                                        {...register('duration', {
                                            required: '请输入时长',
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>是否上架</Field.Label>
                                    <Field.Root>
                                        <Controller
                                            name="isPublished"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <Switch.Root
                                                        name={field.name}
                                                        checked={field.value}
                                                        onCheckedChange={({
                                                            checked,
                                                        }) =>
                                                            field.onChange(
                                                                checked
                                                            )
                                                        }
                                                    >
                                                        <Switch.HiddenInput
                                                            onBlur={
                                                                field.onBlur
                                                            }
                                                        />
                                                        <Switch.Control>
                                                            <Switch.Thumb />
                                                        </Switch.Control>
                                                        <Switch.Label />
                                                    </Switch.Root>
                                                    {/* 可选：错误提示 */}
                                                    {/* <Field.ErrorText>{errors.isPublished?.message}</Field.ErrorText> */}
                                                </>
                                            )}
                                        />
                                    </Field.Root>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>是否免费</Field.Label>
                                    <Field.Root>
                                        <Controller
                                            name="isFree"
                                            control={control}
                                            render={({ field }) => (
                                                <>
                                                    <Switch.Root
                                                        name={field.name}
                                                        checked={field.value}
                                                        onCheckedChange={({
                                                            checked,
                                                        }) =>
                                                            field.onChange(
                                                                checked
                                                            )
                                                        }
                                                    >
                                                        <Switch.HiddenInput
                                                            onBlur={
                                                                field.onBlur
                                                            }
                                                        />
                                                        <Switch.Control>
                                                            <Switch.Thumb />
                                                        </Switch.Control>
                                                        <Switch.Label />
                                                    </Switch.Root>
                                                    {/* 可选：错误提示 */}
                                                    {/* <Field.ErrorText>{errors.isFree?.message}</Field.ErrorText> */}
                                                </>
                                            )}
                                        />
                                    </Field.Root>
                                </Field.Root>
                                <Field.Root invalid={!!errors.price}>
                                    <Field.Label>价格</Field.Label>
                                    <Input
                                        placeholder="价格"
                                        type="number"
                                        step="0.01"
                                        {...register('price', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>合集ID</Field.Label>
                                    <NativeSelect.Root size="sm" width="240px">
                                        <NativeSelect.Field
                                            placeholder="选择合集"
                                            {...register('collectionId')}
                                        >
                                            {collections.map((cat: any) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.title}
                                                </option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>标签（逗号分隔）</Field.Label>
                                    <Input
                                        placeholder="标签,多个用逗号分隔"
                                        {...register('tags', {
                                            setValueAs: (v) =>
                                                typeof v === 'string'
                                                    ? v
                                                          .split(',')
                                                          .map((s: string) =>
                                                              s.trim()
                                                          )
                                                          .filter(Boolean)
                                                    : v,
                                        })}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>排序</Field.Label>
                                    <Input
                                        placeholder="排序"
                                        type="number"
                                        {...register('order', {
                                            valueAsNumber: true,
                                        })}
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
