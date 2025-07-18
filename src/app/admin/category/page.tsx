"use client";
import React, { useMemo, useState } from "react";
import { Box, Button, Heading, Wrap, useDisclosure, Text, Input, Switch, Stack, Field } from "@chakra-ui/react";
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
export default function AdminPage() {
    // tRPC hooks
    // 排序 state
    const [sorting, setSorting] = useState<any[]>([]);
    const orderBy = sorting[0]?.id;
    const order = sorting[0]?.desc ? "desc" : "asc";
    const { data: categories = [], refetch, isLoading } = api.category.list.useQuery(
        orderBy ? { orderBy, order } : undefined
    );
    const createCategory = api.category.create.useMutation({ onSuccess: () => refetch() });
    const updateCategory = api.category.update.useMutation({ onSuccess: () => refetch() });
    const deleteCategory = api.category.delete.useMutation({ onSuccess: () => refetch() });
    const deleteMany = api.category.deleteMany.useMutation({ onSuccess: () => refetch() });

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
        defaultValues: { name: "", description: "", icon: "" },
    });

    const openEdit = (category?: any) => {
        setEditing(category ?? null);
        if (category) {
            reset({
                name: category.name ?? "",
                description: category.description ?? "",
                icon: category.icon ?? "",
            });
        } else {
            reset({ name: "", description: "", icon: "" });
        }
        onOpen();
    };

    const onSubmit = async (data: CategoryForm) => {
        // Ensure no nulls for string fields
        const payload = {
            ...data,
            name: data.name ?? "",
            description: data.description ?? "",
            icon: data.icon ?? "",
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
        await deleteMany.mutateAsync({ ids: rows.map(r => (r).id) });
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
    const normalizedCategories: Category[] = useMemo(() =>
        categories.map(c => ({
            ...c,
            name: c.name ?? "",
            description: c.description ?? "",
            icon: c.icon ?? "",
        })),
        [categories]
    );

    const columns = useMemo(() => [
        { accessorKey: "name", header: "名称", width: 150 },
        { accessorKey: "description", header: "描述", width: 200 },
        { accessorKey: "icon", header: "图标", width: 120, cell: ({ row }: { row: any }) => row.original.icon ? <img src={row.original.icon} alt="icon" style={{ width: 32, height: 32, objectFit: "cover" }} /> : null },
        { accessorKey: "createdAt", header: "创建时间", width: 180, cell: ({ row }: { row: any }) => new Date(row.original.createdAt).toLocaleString() },
        { accessorKey: "updatedAt", header: "更新时间", width: 180, cell: ({ row }: { row: any }) => new Date(row.original.updatedAt).toLocaleString() },
        {
            id: "action",
            header: "操作",
            width: 180,
            cell: ({ row }: { row: { original: Category } }) => (
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
                            ...col, cell: ({ row }: { row: { original: Category } }) => (
                                <Wrap gap={1} flexWrap="nowrap">
                                    <Button size="2xs" colorScheme="blue" onClick={() => openEdit(row.original)}>编辑</Button>
                                    <Button size="2xs" colorScheme="red" onClick={() => handleDeleteWithConfirm(row.original.id)}>删除</Button>
                                </Wrap>
                            )
                        }
                        : col
                )}
                data={useMemo(() => {
                    return categories.map(c => ({
                        ...c,
                        name: c.name ?? "",
                        description: c.description ?? "",
                        icon: c.icon ?? "",
                    }));
                }, [categories])}
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
                        <Heading size="md" mb={4}>{editing ? "编辑" : "新增"}分类</Heading>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Stack gap={2}>
                                <Field.Root invalid={!!errors.name}>
                                    <Field.Label>名称</Field.Label>
                                    <Input placeholder="名称" {...register("name", { required: "请输入名称" })} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>描述</Field.Label>
                                    <Input placeholder="描述" {...register("description")} />
                                </Field.Root>
                                <Field.Root invalid={!!errors.icon}>
                                    <Field.Label>图标URL</Field.Label>
                                    <Input placeholder="图标URL" {...register("icon", { required: "请输入图标URL" })} />
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