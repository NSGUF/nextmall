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
    Text,
} from '@chakra-ui/react';
import DataTable from '../../_components/DataTable';
import { api } from '@/trpc/react';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import ImageUpload from '../../_components/ImageUpload';
import VideoUpload from '../../_components/VideoUpload';
import DurationInput from '../../_components/DurationInput';
import { useSession } from 'next-auth/react';
import { formatDuration } from '@/app/utils/formatDuration';

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
    // 获取当前用户会话
    const { data: session } = useSession();
    const currentUserId = session?.user?.id;

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
        data: courseResponse,
        refetch,
        isLoading,
    } = api.course.list.useQuery({
        ...(orderBy ? { orderBy, order } : {}),
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    });

    const courses = courseResponse?.data ?? [];
    const pageCount = courseResponse?.pagination?.totalPages ?? 0;

    // 分页回调函数
    const handlePaginationChange = (newPagination: {
        pageIndex: number;
        pageSize: number;
    }) => {
        setPagination(newPagination);
    };
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

    // 图片上传 mutation
    const uploadImage = api.util.uploadImage.useMutation();

    // 获取分类列表用于下拉
    const { data: collectionResponse } = api.collection.list.useQuery();
    const collections = collectionResponse?.data ?? [];

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
            isPublished: false,
            collectionId: undefined,
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
                isPublished: course.isPublished ?? false,
                collectionId: course.collectionId ?? undefined,
            });
        } else {
            reset({
                title: '',
                description: '',
                videoUrl: '',
                coverImage: '',
                duration: 0,
                isPublished: false,
                collectionId: undefined,
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
            isPublished: data.isPublished ?? false,
            collectionId: data.collectionId ?? undefined,
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

    // 批量删除确认弹窗
    const [bulkDeleteRows, setBulkDeleteRows] = useState<any[]>([]);
    const {
        ConfirmDialog: BulkDeleteConfirmDialog,
        open: openBulkDeleteConfirm,
        close: closeBulkDeleteConfirm,
    } = useConfirmDialog({
        title: '确认批量删除',
        content: `确定要删除选中的 ${bulkDeleteRows.length} 个课程吗？此操作不可撤销。`,
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
            { accessorKey: 'description', header: '描述', width: 200 },
            {
                accessorKey: 'videoUrl',
                header: '视频预览',
                width: 200,
                cell: ({ row }: { row: any }) =>
                    row.original.videoUrl ? (
                        <video
                            src={row.original.videoUrl}
                            style={{
                                width: '80px',
                                height: '45px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                            }}
                            controls={false}
                            muted
                        />
                    ) : (
                        <Text fontSize="sm" color="gray.500">
                            无视频
                        </Text>
                    ),
            },
            {
                accessorKey: 'duration',
                header: '时长',
                width: 100,
                cell: ({ row }: { row: any }) =>
                    formatDuration(row.original.duration || 0),
            },

            { accessorKey: 'views', header: '播放次数', width: 100 },
            {
                accessorKey: 'isPublished',
                header: '上架',
                width: 80,
                cell: ({ row }: { row: any }) =>
                    row.original.isPublished ? '是' : '否',
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

    // Memoize the data to avoid unnecessary re-renders
    const memoizedData = useMemo(() => {
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
        })) as any;
    }, [courses]);

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
                            {editing ? '编辑' : '新增'}课程
                        </Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Field.Root>
                                    <Field.Label>合集</Field.Label>
                                    <NativeSelect.Root size="sm">
                                        <NativeSelect.Field
                                            placeholder="选择合集"
                                            {...register('collectionId', {
                                                required: '请选择合集',
                                            })}
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

                                    {errors.collectionId && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.collectionId.message}
                                        </Text>
                                    )}
                                </Field.Root>
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
                                                value: 100,
                                                message:
                                                    '标题不能超过100个字符',
                                            },
                                        })}
                                    />
                                    {errors.title && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.title.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root invalid={!!errors.description}>
                                    <Field.Label>描述</Field.Label>
                                    <Input
                                        placeholder="描述（可选）"
                                        {...register('description', {
                                            maxLength: {
                                                value: 500,
                                                message:
                                                    '描述不能超过500个字符',
                                            },
                                        })}
                                    />
                                    {errors.description && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.description.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root invalid={!!errors.videoUrl}>
                                    <Field.Label>视频文件</Field.Label>
                                    <Controller
                                        name="videoUrl"
                                        control={control}
                                        rules={{ required: '请上传视频文件' }}
                                        render={({ field }) => (
                                            <VideoUpload
                                                value={field.value}
                                                onChange={field.onChange}
                                                onThumbnailGenerated={(
                                                    thumbnailBase64
                                                ) => {
                                                    // 上传缩略图
                                                    uploadImage.mutate(
                                                        {
                                                            image: thumbnailBase64,
                                                            filename:
                                                                'thumbnail.jpg',
                                                            folder: 'courses/thumbnails',
                                                        },
                                                        {
                                                            onSuccess: (
                                                                result
                                                            ) => {
                                                                // 设置封面图
                                                                setValue(
                                                                    'coverImage',
                                                                    result.url
                                                                );
                                                            },
                                                            onError: (
                                                                error
                                                            ) => {
                                                                console.warn(
                                                                    '缩略图上传失败:',
                                                                    error
                                                                );
                                                            },
                                                        }
                                                    );
                                                }}
                                                onDurationExtracted={(
                                                    duration
                                                ) => {
                                                    // 自动设置视频时长
                                                    setValue(
                                                        'duration',
                                                        duration
                                                    );
                                                }}
                                                folder="courses"
                                                placeholder="点击上传视频文件"
                                            />
                                        )}
                                    />
                                    {errors.videoUrl && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.videoUrl.message}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>封面图</Field.Label>
                                    <Controller
                                        name="coverImage"
                                        control={control}
                                        render={({ field }) => (
                                            <Box>
                                                {field.value ? (
                                                    <img
                                                        src={field.value}
                                                        alt="封面图"
                                                        style={{
                                                            width: '200px',
                                                            height: '112px',
                                                            objectFit: 'cover',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                        }}
                                                    />
                                                ) : (
                                                    <Box
                                                        w="200px"
                                                        h="112px"
                                                        bg="gray.100"
                                                        borderRadius="8px"
                                                        border="1px solid #e2e8f0"
                                                        display="flex"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <Text
                                                            fontSize="sm"
                                                            color="gray.500"
                                                        >
                                                            上传视频后自动生成
                                                        </Text>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
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
                                {/* <Field.Root>
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
                                                </>
                                            )}
                                        />
                                    </Field.Root>
                                </Field.Root> */}
                                {/* <Field.Root invalid={!!errors.price}>
                                    <Field.Label>价格</Field.Label>
                                    <Input
                                        placeholder="价格"
                                        type="number"
                                        step="0.01"
                                        {...register('price', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field.Root> */}

                                {/* <Field.Root>
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
                                </Field.Root> */}
                                {/* <Field.Root>
                                    <Field.Label>排序</Field.Label>
                                    <Input
                                        placeholder="排序"
                                        type="number"
                                        {...register('order', {
                                            valueAsNumber: true,
                                        })}
                                    />
                                </Field.Root> */}
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
