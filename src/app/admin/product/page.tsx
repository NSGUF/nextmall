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
    Flex,
    Textarea,
    Text,
} from '@chakra-ui/react';
import DataTable from '../_components/DataTable';
import { api } from '@/trpc/react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { FiTrash2 } from 'react-icons/fi';

export default function AdminPage() {
    // tRPC hooks
    // 排序 state
    const [sorting, setSorting] = useState<any[]>([]);
    const orderBy = sorting[0]?.id;
    const order = sorting[0]?.desc ? 'desc' : 'asc';
    const {
        data: products = [],
        refetch,
        isLoading,
    } = api.product.list.useQuery(orderBy ? { orderBy, order } : undefined);
    console.log(products);
    const createProduct = api.product.create.useMutation({
        onSuccess: () => refetch(),
    });
    const updateProduct = api.product.update.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteProduct = api.product.delete.useMutation({
        onSuccess: () => refetch(),
    });
    const deleteMany = api.product.deleteMany.useMutation({
        onSuccess: () => refetch(),
    });

    // 获取分类列表用于下拉
    const { data: categories = [] } = api.category.list.useQuery();
    // 供应商
    const { data: vendors = [] } = api.user.getAllVendors.useQuery();

    // 新增/编辑弹窗
    const [editing, setEditing] = useState(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const defaultValues = {
        title: '',
        images: [],
        minAmount: 0,
        logistics: '包邮',
        logiPrice: 0,
        description: '',
        isActive: true,
        categoryId: undefined,
        specs: [
            {
                name: '',
                value: '',
                price: undefined,
                stock: undefined,
                image: '',
            },
        ],
    };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm({
        defaultValues,
    });

    // 规格 useFieldArray
    const {
        fields: specFields,
        append: appendSpec,
        remove: removeSpec,
    } = useFieldArray({
        control,
        name: 'specs',
    });

    const openEdit = (product?: any) => {
        setEditing(product ?? null);
        if (product) {
            reset(product);
        } else {
            reset(defaultValues);
        }
        onOpen();
    };

    const onSubmit = async (data) => {
        const payload = data;
        if (editing) {
            await updateProduct.mutateAsync({ ...payload, id: editing.id });
        } else {
            await createProduct.mutateAsync(payload);
        }
        onClose();
    };

    // 批量删除
    const handleBulkDelete = async (rows: any[]) => {
        if (!rows.length) return;
        await deleteMany.mutateAsync({ ids: rows.map((r) => r.id) });
    };
    const handleDelete = async (id: string) => {
        await deleteProduct.mutateAsync({ id });
    };

    // 删除确认弹窗
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const {
        ConfirmDialog: DeleteConfirmDialog,
        open: openDeleteConfirm,
        close: closeDeleteConfirm,
    } = useConfirmDialog({
        title: '确认删除',
        content: '确定要删除该产品吗？',
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
            {
                accessorKey: 'images',
                header: '图片',
                width: 120,
                cell: ({ row }: { row: any }) =>
                    row.original.images && row.original.images.length > 0 ? (
                        <img
                            src={row.original.images[0]}
                            alt="product"
                            style={{
                                width: 32,
                                height: 32,
                                objectFit: 'cover',
                            }}
                        />
                    ) : null,
            },

            {
                accessorKey: 'isActive',
                header: '上架',
                width: 80,
                cell: ({ row }: { row: any }) =>
                    row.original.isActive ? '是' : '否',
            },
            { accessorKey: 'sales', header: '销量', width: 80 },
            { accessorKey: 'categoryId', header: '分类ID', width: 120 },
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
                cell: ({ row }: { row: { original } }) => (
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
                <Heading size="lg">产品管理</Heading>
            </Box>
            <DataTable
                columns={columns.map((col) =>
                    col.id === 'action'
                        ? {
                              ...col,
                              cell: ({ row }: { row: { original } }) => (
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
                    return products;
                }, [products])}
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
                    <Box bg="white" p={6} borderRadius="md" minW={600}>
                        <Heading size="md" mb={4}>
                            {editing ? '编辑' : '新增'}商品
                        </Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Flex gap={2}>
                                    <Field.Root invalid={!!errors.categoryId}>
                                        <Field.Label>分类</Field.Label>
                                        <NativeSelect.Root size="md">
                                            <NativeSelect.Field
                                                placeholder="选择分类"
                                                {...register('categoryId', {
                                                    required: '请选择分类',
                                                })}
                                            >
                                                {categories.map((cat: any) => (
                                                    <option
                                                        key={cat.id}
                                                        value={cat.id}
                                                    >
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                        {errors.categoryId && (
                                            <Text color="red.500" fontSize="sm">
                                                {
                                                    errors.categoryId
                                                        .message as string
                                                }
                                            </Text>
                                        )}
                                    </Field.Root>
                                    <Field.Root invalid={!!errors.vendorId}>
                                        <Field.Label>供应商</Field.Label>
                                        <NativeSelect.Root size="md">
                                            <NativeSelect.Field
                                                placeholder="选择供应商"
                                                {...register('vendorId', {
                                                    required: '请选择供应商',
                                                })}
                                            >
                                                {vendors.map((cat: any) => (
                                                    <option
                                                        key={cat.id}
                                                        value={cat.id}
                                                    >
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                        {errors.vendorId && (
                                            <Text color="red.500" fontSize="sm">
                                                {
                                                    errors.vendorId
                                                        .message as string
                                                }
                                            </Text>
                                        )}
                                    </Field.Root>
                                    <Field.Root invalid={!!errors.title}>
                                        <Field.Label>标题</Field.Label>
                                        <Input
                                            placeholder="标题"
                                            {...register('title', {
                                                required: '请输入标题',
                                            })}
                                        />
                                        {errors.title && (
                                            <Text color="red.500" fontSize="sm">
                                                {errors.title.message as string}
                                            </Text>
                                        )}
                                    </Field.Root>
                                </Flex>
                                <Field.Root invalid={!!errors.images}>
                                    <Field.Label>
                                        图片（逗号分隔URL）
                                    </Field.Label>
                                    <Input
                                        placeholder="图片URL,多个用逗号分隔"
                                        {...register('images', {
                                            required: '请填写图片URL',
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
                                    {errors.images && (
                                        <Text color="red.500" fontSize="sm">
                                            {errors.images.message as string}
                                        </Text>
                                    )}
                                </Field.Root>
                                <Flex gap={2}>
                                    <Field.Root invalid={!!errors.minAmount}>
                                        <Field.Label>最低购买价</Field.Label>
                                        <Input
                                            placeholder="最低购买"
                                            type="number"
                                            {...register('minAmount', {
                                                required: '请输入最低购买价',
                                                valueAsNumber: true,
                                            })}
                                        />
                                    </Field.Root>
                                    <Field.Root invalid={!!errors.logistics}>
                                        <Field.Label>物流方式</Field.Label>
                                        <Input
                                            placeholder="物流方式"
                                            {...register('logistics', {
                                                required: '请输入物流方式',
                                            })}
                                        />
                                        {errors.logistics && (
                                            <Text color="red.500" fontSize="sm">
                                                {
                                                    errors.logistics
                                                        .message as string
                                                }
                                            </Text>
                                        )}
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>物流价格</Field.Label>
                                        <Input
                                            placeholder="物流价格（包邮默认写0）"
                                            type="number"
                                            {...register('logiPrice', {
                                                valueAsNumber: true,
                                            })}
                                        />
                                    </Field.Root>
                                </Flex>

                                {/* 规格管理区 */}
                                <Box flex={1}>
                                    <Text fontWeight="bold" mb={1}>
                                        规格
                                    </Text>
                                    {specFields.map((field, idx) => (
                                        <Flex
                                            key={field.id}
                                            gap={2}
                                            align="center"
                                            border="1px solid #eee"
                                            borderRadius="md"
                                            p={3}
                                            mb={1}
                                        >
                                            <Input
                                                placeholder="单位"
                                                {...register(
                                                    `specs.${idx}.name` as const,
                                                    {
                                                        required: '必填',
                                                    }
                                                )}
                                            />
                                            <Input
                                                placeholder="规格描述"
                                                {...register(
                                                    `specs.${idx}.value` as const,
                                                    {
                                                        required: '必填',
                                                    }
                                                )}
                                            />
                                            <Input
                                                placeholder="价格"
                                                type="number"
                                                {...register(
                                                    `specs.${idx}.price` as const,
                                                    {
                                                        required: '必填',
                                                        valueAsNumber: true,
                                                    }
                                                )}
                                            />
                                            <Input
                                                placeholder="库存"
                                                type="number"
                                                {...register(
                                                    `specs.${idx}.stock` as const,
                                                    {
                                                        required: '必填',
                                                        valueAsNumber: true,
                                                    }
                                                )}
                                            />
                                            <Input
                                                placeholder="图片URL"
                                                {...register(
                                                    `specs.${idx}.image`,
                                                    {
                                                        required:
                                                            '请填写图片URL',
                                                    }
                                                )}
                                            />
                                            {specFields.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    colorScheme="red"
                                                    onClick={() =>
                                                        removeSpec(idx)
                                                    }
                                                >
                                                    <FiTrash2 />
                                                </Button>
                                            )}
                                        </Flex>
                                    ))}
                                    <Button
                                        mt={2}
                                        onClick={() =>
                                            appendSpec({
                                                name: '',
                                                value: '',
                                                price: undefined,
                                                stock: undefined,
                                                image: '',
                                            })
                                        }
                                        colorScheme="blue"
                                        variant="outline"
                                    >
                                        + 添加规格
                                    </Button>
                                </Box>
                                <Field.Root invalid={!!errors.description}>
                                    <Field.Label>描述</Field.Label>
                                    <Textarea
                                        placeholder="描述"
                                        {...register('description', {
                                            required: '请输入描述',
                                        })}
                                    />
                                    {errors.description && (
                                        <Text color="red.500" fontSize="sm">
                                            {
                                                errors.description
                                                    .message as string
                                            }
                                        </Text>
                                    )}
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>是否上架</Field.Label>
                                    <Field.Root>
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
                                                    {/* <Field.ErrorText>{errors.isActive?.message}</Field.ErrorText> */}
                                                </>
                                            )}
                                        />
                                    </Field.Root>
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
