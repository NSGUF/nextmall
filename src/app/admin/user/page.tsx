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
    Portal,
    Select,
    createListCollection,
} from '@chakra-ui/react';
import DataTable from '../_components/DataTable';
import { api } from '@/trpc/react';
import { useForm } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { ContentLoading } from '@/app/_components/LoadingSpinner';
import { ROLES } from '@/app/const/status';

// react-hook-form
type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: boolean;
    role: ROLES;
    createdAt: Date;
    updatedAt: Date;
};

type UserForm = {
    name: string;
    email?: string;
    phone: string; // 变更为必填（去掉?）
    status: boolean;
    role: ROLES;
    password?: string;
};
const frameworks = createListCollection({
    items: [
        { label: '普通用户', value: ROLES.NORMAL },
        { label: '供应商', value: ROLES.VENDOR },
        { label: '超级管理员', value: ROLES.SUPERADMIN },
    ],
});
export default function UserManagePage() {
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
        data: userResponse,
        refetch,
        isLoading,
    } = api.user.list.useQuery({
        ...(orderBy ? { orderBy, order } : {}),
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
    });

    const users = userResponse?.data ?? [];
    const pageCount = userResponse?.pagination?.totalPages ?? 0;

    // 分页回调函数
    const handlePaginationChange = (newPagination: {
        pageIndex: number;
        pageSize: number;
    }) => {
        setPagination(newPagination);
    };

    const createUser = api.user.create.useMutation({
        onSuccess: () => refetch(),
    });
    const updateUser = api.user.update.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteUser = api.user.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteMany = api.user.deleteMany.useMutation({
        onSuccess: () => refetch(),
    });

    // 新增/编辑弹窗
    const [editing, setEditing] = useState<User | null>(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<UserForm>({
        defaultValues: {
            name: '',
            email: '',
            phone: '', // 变更
            status: true,
            role: ROLES.NORMAL,
            password: '',
        },
    });

    const openEdit = (user?: any) => {
        setEditing(user ?? null);
        if (user) {
            reset({
                name: user.name ?? '',
                email: user.email ?? '',
                phone: user.phone ?? '', // 变更
                status: user.status ?? true,
                role: user.role ?? ROLES.NORMAL,
                password: '', // 编辑时密码为空，表示不修改
            });
        } else {
            reset({
                name: '',
                email: '',
                phone: '', // 变更
                status: true,
                role: ROLES.NORMAL,
                password: '',
            });
        }
        onOpen();
    };

    const onSubmit = async (data: UserForm) => {
        // Ensure no nulls for string fields
        const payload = {
            ...data,
            name: data.name ?? '',
            email: data.email || undefined,
            phone: data.phone, // 保证是必填
            password: data.password || undefined,
        };
        if (editing) {
            await updateUser.mutateAsync({ ...payload, id: editing.id } as any);
        } else {
            await createUser.mutateAsync(payload as any);
        }
        onClose();
    };

    // 删除确认弹窗
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该用户吗？',
        confirmText: '删除',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
        onConfirm: async () => {
            if (deleteId) {
                await deleteUser.mutateAsync({ id: deleteId });
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
    const [bulkDeleteRows, setBulkDeleteRows] = useState<string[]>([]);
    const {
        ConfirmDialog: BulkDeleteConfirmDialog,
        open: openBulkDeleteConfirm,
        close: closeBulkDeleteConfirm,
    } = useConfirmDialog({
        title: '确认批量删除',
        content: `确定要删除选中的 ${bulkDeleteRows.length} 个用户吗？此操作不可撤销。`,
        confirmText: '删除',
        cancelText: '取消',
        buttonProps: { style: { display: 'none' } }, // 不显示按钮，手动控制
        onConfirm: async () => {
            if (bulkDeleteRows.length > 0) {
                await deleteMany.mutateAsync({ ids: bulkDeleteRows });
                setBulkDeleteRows([]);
            }
        },
        onCancel: () => setBulkDeleteRows([]),
    });

    const handleBatchDeleteWithConfirm = (ids: string[]) => {
        setBulkDeleteRows(ids);
        openBulkDeleteConfirm();
    };

    // 表格列定义
    const columns = useMemo(
        () => [
            { accessorKey: 'name', header: '用户名', width: 120 },
            { accessorKey: 'email', header: '邮箱', width: 180 },
            { accessorKey: 'phone', header: '手机号', width: 120 },
            {
                accessorKey: 'status',
                header: '状态',
                width: 80,
                cell: ({ row }: { row: { original: User } }) => (
                    <Text color={row.original.status ? 'green.500' : 'red.500'}>
                        {row.original.status ? '正常' : '禁用'}
                    </Text>
                ),
            },
            {
                accessorKey: 'role',
                header: '角色',
                width: 100,
                cell: ({ row }: { row: { original: User } }) => {
                    const roleMap = {
                        SUPERADMIN: '超级管理员',
                        VENDOR: '供应商',
                        STORE: '门店',
                        NORMAL: '普通用户',
                    };
                    return <Text>{roleMap[row.original.role]}</Text>;
                },
            },
            {
                accessorKey: 'createdAt',
                header: '创建时间',
                width: 150,
                cell: ({ row }: { row: { original: User } }) => (
                    <Text>
                        {new Date(row.original.createdAt).toLocaleString()}
                    </Text>
                ),
            },
            {
                id: 'action',
                header: '操作',
                width: 180,
                cell: ({ row }: { row: { original: User } }) => (
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
        return users;
    }, [users]);

    if (isLoading) {
        return <ContentLoading />;
    }

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
            >
                <Heading size="lg">用户管理</Heading>
                {/* 新增用户按钮 */}
                <Button colorScheme="blue" onClick={() => openEdit(undefined)}>
                    新增用户
                </Button>
            </Box>
            <DataTable
                columns={columns.map((col) =>
                    col.id === 'action'
                        ? {
                              ...col,
                              cell: ({ row }: { row: { original: User } }) => (
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
                                          disabled={
                                              row.original.role ===
                                              ROLES.SUPERADMIN
                                          }
                                      >
                                          删除
                                      </Button>
                                  </Wrap>
                              ),
                          }
                        : col
                )}
                data={memoizedData as any}
                pageCount={pageCount}
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
                    <Box
                        bg="white"
                        p={6}
                        borderRadius="md"
                        minW={400}
                        maxH="90vh"
                        overflowY="auto"
                    >
                        <Heading size="md" mb={4}>
                            {editing ? '编辑' : '新增'}用户
                        </Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Field.Root invalid={!!errors.name}>
                                    <Field.Label>用户名 *</Field.Label>
                                    <Input
                                        placeholder="用户名"
                                        {...register('name', {
                                            required: '请输入用户名',
                                            minLength: {
                                                value: 1,
                                                message: '用户名不能为空',
                                            },
                                            maxLength: {
                                                value: 50,
                                                message:
                                                    '用户名不能超过50个字符',
                                            },
                                        })}
                                    />
                                    {errors.name && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.name.message}
                                        </Text>
                                    )}
                                </Field.Root>

                                <Field.Root invalid={!!errors.email}>
                                    <Field.Label>邮箱</Field.Label>
                                    <Input
                                        type="email"
                                        placeholder="邮箱"
                                        {...register('email', {
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: '邮箱格式不正确',
                                            },
                                        })}
                                    />
                                    {errors.email && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.email.message}
                                        </Text>
                                    )}
                                </Field.Root>

                                <Field.Root invalid={!!errors.phone}>
                                    <Field.Label>手机号 *</Field.Label>
                                    <Input
                                        placeholder="手机号"
                                        {...register('phone', {
                                            required: '请输入手机号',
                                            pattern: {
                                                value: /^1[3-9]\d{9}$/,
                                                message: '手机号格式不正确',
                                            },
                                            // 可以加入更多校验如手机号格式
                                        })}
                                    />
                                    {errors.phone && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.phone.message}
                                        </Text>
                                    )}
                                </Field.Root>

                                <Field.Root invalid={!!errors.password}>
                                    <Field.Label>
                                        密码{' '}
                                        {editing ? '(留空表示不修改)' : '*'}
                                    </Field.Label>
                                    <Input
                                        type="password"
                                        placeholder={
                                            editing
                                                ? '留空表示不修改密码'
                                                : '密码'
                                        }
                                        {...register('password', {
                                            required: editing
                                                ? false
                                                : '请输入密码',
                                            minLength: {
                                                value: 6,
                                                message: '密码至少6位',
                                            },
                                        })}
                                    />
                                    {errors.password && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.password.message}
                                        </Text>
                                    )}
                                </Field.Root>

                                <Field.Root invalid={!!errors.role}>
                                    <Field.Label>角色 *</Field.Label>
                                    <Controller
                                        name="role"
                                        control={control}
                                        rules={{ required: '请选择角色' }}
                                        render={({ field }) => (
                                            <Select.Root
                                                collection={frameworks}
                                                width="320px"
                                                value={[field.value]}
                                                onValueChange={(e) =>
                                                    field.onChange(e.value[0])
                                                }
                                            >
                                                <Select.HiddenSelect />

                                                <Select.Control>
                                                    <Select.Trigger>
                                                        <Select.ValueText placeholder="Select framework" />
                                                    </Select.Trigger>
                                                    <Select.IndicatorGroup>
                                                        <Select.Indicator />
                                                    </Select.IndicatorGroup>
                                                </Select.Control>
                                                <Portal>
                                                    <Select.Positioner>
                                                        <Select.Content>
                                                            {frameworks.items.map(
                                                                (framework) => (
                                                                    <Select.Item
                                                                        item={
                                                                            framework
                                                                        }
                                                                        key={
                                                                            framework.value
                                                                        }
                                                                    >
                                                                        {
                                                                            framework.label
                                                                        }
                                                                        <Select.ItemIndicator />
                                                                    </Select.Item>
                                                                )
                                                            )}
                                                        </Select.Content>
                                                    </Select.Positioner>
                                                </Portal>
                                            </Select.Root>
                                        )}
                                    />
                                    {errors.role && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.role.message}
                                        </Text>
                                    )}
                                </Field.Root>

                                <Field.Root invalid={!!errors.status}>
                                    <Field.Label>状态</Field.Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <>
                                                <Switch.Root
                                                    name={field.name}
                                                    checked={!!field.value}
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

                                <Wrap gap={2} justify="flex-end" mt={4}>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onClose}
                                    >
                                        取消
                                    </Button>
                                    <Button
                                        type="submit"
                                        colorScheme="blue"
                                        loading={isSubmitting}
                                    >
                                        {editing ? '更新' : '创建'}
                                    </Button>
                                </Wrap>
                            </Stack>
                        </form>
                    </Box>
                </Box>
            )}
            {DeleteConfirmDialog}
            {BulkDeleteConfirmDialog}
        </Box>
    );
}
