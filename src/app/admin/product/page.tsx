"use client";
import React, { useMemo, useState } from "react";
import { Box, Button, Heading, Wrap, useDisclosure, NativeSelect, Input, Switch, Stack, Field } from "@chakra-ui/react";
import DataTable from "../_components/DataTable";
import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";

// react-hook-form
type Category = {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    createdAt: Date;
    updatedAt: Date;
};
type CategoryForm = Omit<Category, "id" | "createdAt" | "updatedAt"> & { id?: string };

// Product 类型
type Product = {
    id: string;
    title: string;
    images: string[];
    price: number;
    stock: number;
    ownerId: string;
    logistics: string;
    description: string;
    isActive: boolean;
    sales: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    categoryId?: string;
};
type ProductForm = Omit<Product, "id" | "createdAt" | "updatedAt" | "sales" | "isDeleted"> & { id?: string };

export default function AdminPage() {
    // tRPC hooks
    // 排序 state
    const [sorting, setSorting] = useState<any[]>([]);
    const orderBy = sorting[0]?.id;
    const order = sorting[0]?.desc ? "desc" : "asc";
    const { data: products = [], refetch, isLoading } = api.product.list.useQuery(
        orderBy ? { orderBy, order } : undefined
    );
    const createProduct = api.product.create.useMutation({ onSuccess: () => refetch() });
    const updateProduct = api.product.update.useMutation({ onSuccess: () => refetch() });
    const deleteProduct = api.product.delete.useMutation({ onSuccess: () => refetch() });
    const deleteMany = api.product.deleteMany.useMutation({ onSuccess: () => refetch() });

    // 获取分类列表用于下拉
    const { data: categories = [] } = api.category.list.useQuery();

    // 新增/编辑弹窗
    const [editing, setEditing] = useState<Product | null>(null);
    const { open: isOpen, onOpen, onClose } = useDisclosure();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
        control,
    } = useForm<ProductForm>({
        defaultValues: { title: "", images: [], price: 0, stock: 0, ownerId: "", logistics: "", description: "", isActive: true, categoryId: undefined },
    });

    const openEdit = (product?: any) => {
        setEditing(product ?? null);
        if (product) {
            reset({
                title: product.title ?? "",
                images: product.images ?? [],
                price: product.price ?? 0,
                stock: product.stock ?? 0,
                ownerId: product.ownerId ?? "",
                logistics: product.logistics ?? "",
                description: product.description ?? "",
                isActive: product.isActive ?? true,
                categoryId: product.categoryId ?? undefined,
            });
        } else {
            reset({ title: "", images: [], price: 0, stock: 0, ownerId: "", logistics: "", description: "", isActive: true, categoryId: undefined });
        }
        onOpen();
    };

    const onSubmit = async (data: ProductForm) => {
        const payload = {
            ...data,
            title: data.title ?? "",
            images: data.images ?? [],
            price: data.price ?? 0,
            stock: data.stock ?? 0,
            ownerId: data.ownerId ?? "",
            logistics: data.logistics ?? "",
            description: data.description ?? "",
            isActive: data.isActive ?? true,
            categoryId: data.categoryId ?? undefined,
        };
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
        await deleteMany.mutateAsync({ ids: rows.map(r => (r).id) });
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
        title: "确认删除",
        content: "确定要删除该分类吗？",
        confirmText: "删除",
        cancelText: "取消",
        buttonProps: { style: { display: "none" } }, // 不显示按钮，手动控制
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

    // Map 分类s to ensure no nulls for string fields before passing to DataTable
    const normalizedProducts: Product[] = useMemo(() =>
        products.map(p => ({
            ...p,
            title: p.title ?? "",
            images: p.images ?? [],
            price: p.price ?? 0,
            stock: p.stock ?? 0,
            ownerId: p.ownerId ?? "",
            logistics: p.logistics ?? "",
            description: p.description ?? "",
            isActive: p.isActive ?? true,
            categoryId: p.categoryId ?? undefined,
        })),
        [products]
    );

    const columns = useMemo(() => [
        { accessorKey: "title", header: "标题", width: 150 },
        { accessorKey: "images", header: "图片", width: 120, cell: ({ row }: { row: any }) => row.original.images && row.original.images.length > 0 ? <img src={row.original.images[0]} alt="product" style={{ width: 32, height: 32, objectFit: "cover" }} /> : null },
        { accessorKey: "price", header: "价格", width: 100 },
        { accessorKey: "stock", header: "库存", width: 80 },
        { accessorKey: "isActive", header: "上架", width: 80, cell: ({ row }: { row: any }) => row.original.isActive ? "是" : "否" },
        { accessorKey: "sales", header: "销量", width: 80 },
        { accessorKey: "categoryId", header: "分类ID", width: 120 },
        { accessorKey: "createdAt", header: "创建时间", width: 180, cell: ({ row }: { row: any }) => new Date(row.original.createdAt).toLocaleString() },
        { accessorKey: "updatedAt", header: "更新时间", width: 180, cell: ({ row }: { row: any }) => new Date(row.original.updatedAt).toLocaleString() },
        {
            id: "action",
            header: "操作",
            width: 180,
            cell: ({ row }: { row: { original: Product } }) => (
                <Wrap gap={1} flexWrap="nowrap">
                    <Button size="2xs" colorScheme="blue" onClick={() => openEdit(row.original)}>编辑</Button>
                    <Button size="2xs" colorScheme="red" onClick={() => handleDeleteWithConfirm(row.original.id)}>删除</Button>
                </Wrap>
            ),
        },
    ], [openEdit]);

    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="lg">分类管理</Heading>
            </Box>
            <DataTable
                columns={columns.map(col =>
                    col.id === "action"
                        ? {
                            ...col, cell: ({ row }: { row: { original: Product } }) => (
                                <Wrap gap={1} flexWrap="nowrap">
                                    <Button size="2xs" colorScheme="blue" onClick={() => openEdit(row.original)}>编辑</Button>
                                    <Button size="2xs" colorScheme="red" onClick={() => handleDeleteWithConfirm(row.original.id)}>删除</Button>
                                </Wrap>
                            )
                        }
                        : col
                )}
                data={useMemo(() => {
                    return products.map(p => ({
                        ...p,
                        title: p.title ?? "",
                        images: p.images ?? [],
                        price: p.price ?? 0,
                        stock: p.stock ?? 0,
                        ownerId: p.ownerId ?? "",
                        logistics: p.logistics ?? "",
                        description: p.description ?? "",
                        isActive: p.isActive ?? true,
                        categoryId: p.categoryId ?? undefined,
                    }));
                }, [products])}
                selectable
                manualSorting
                onSortingChange={setSorting}
                renderBulkActions={rows => {
                    const hasSelection = rows.length > 0;
                    return (
                        <>
                            <Button size="sm" colorScheme="red" onClick={() => handleBulkDelete(rows)} disabled={!hasSelection}>
                                批量删除
                            </Button>
                            <Button colorScheme="blue" onClick={() => openEdit()}>新增</Button>
                        </>
                    );
                }}
            />

            {/* 新增/编辑弹窗 */}
            {isOpen && (
                <Box position="fixed" left={0} top={0} w="100vw" h="100vh" bg="blackAlpha.400" zIndex={1000} display="flex" alignItems="center" justifyContent="center">
                    <Box bg="white" p={6} borderRadius="md" minW={400}>
                        <Heading size="md" mb={4}>{editing ? "编辑" : "新增"}商品</Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Field.Root invalid={!!errors.title}>
                                    <Field.Label>标题</Field.Label>
                                    <Input placeholder="标题" {...register("title", { required: "请输入标题" })} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>图片（逗号分隔URL）</Field.Label>
                                    <Input placeholder="图片URL,多个用逗号分隔" {...register("images", {
                                        setValueAs: v => typeof v === 'string' ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : v
                                    })} />
                                </Field.Root>
                                <Field.Root invalid={!!errors.price}>
                                    <Field.Label>价格</Field.Label>
                                    <Input placeholder="价格" type="number" step="0.01" {...register("price", { required: "请输入价格", valueAsNumber: true })} />
                                </Field.Root>
                                <Field.Root invalid={!!errors.stock}>
                                    <Field.Label>库存</Field.Label>
                                    <Input placeholder="库存" type="number" {...register("stock", { required: "请输入库存", valueAsNumber: true })} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>物流</Field.Label>
                                    <Input placeholder="物流方式" {...register("logistics")} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>描述</Field.Label>
                                    <Input placeholder="描述" {...register("description")} />
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
                                                        onCheckedChange={({ checked }) => field.onChange(checked)}
                                                    >
                                                        <Switch.HiddenInput onBlur={field.onBlur} />
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
                                <Field.Root>
                                    <Field.Label>分类ID</Field.Label>
                                    <NativeSelect.Root size="sm" width="240px">
                                        <NativeSelect.Field
                                            placeholder="选择分类"
                                            {...register("categoryId")}
                                        >
                                            {categories.map((cat: any) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </Stack>
                            <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                                <Button onClick={onClose} type="button">取消</Button>
                                <Button colorScheme="blue" type="submit" loading={isSubmitting}>保存</Button>
                            </Box>
                        </form>
                    </Box>
                </Box>
            )}
            {DeleteConfirmDialog}
        </Box>
    );
}