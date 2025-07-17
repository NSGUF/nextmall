"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Heading, Wrap } from "@chakra-ui/react";
import {
    Box,
    Button,
    IconButton,
    Input,
    Text,
    useDisclosure,
    Textarea,
    VStack,
    Portal,
    CloseButton,
    Table,
    Dialog, Field, Menu, Checkbox, NativeSelect, Pagination, ButtonGroup,
    Separator,
} from "@chakra-ui/react";
import DataTable from "../_components/DataTable";
import FilterButton from "../_components/FilterButton";
import { EditBtn, ViewBtn, MenuBtn } from "../_components/Buttons";

const companyTableData = [
];

// 业务相关：定义 columns，包括 action 列
const columns = [
    { accessorKey: "title", header: "标题", width: 150 },
    { accessorKey: "description", header: "描述", width: 150 },
    { accessorKey: "image", header: "图片", width: 150 },
    { accessorKey: "isActive", header: "是否启用", width: 150 },
    {
        id: "action",
        header: "Action",
        width: 150,
        cell: ({ row }) => (
            <Wrap gap={1} flexWrap="nowrap">
                <EditBtn row={row.original} />
                <ViewBtn row={row.original} />
                <MenuBtn row={row.original} />
            </Wrap>
        ),
    },
];

// 导入弹窗
const ImportDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [file, setFile] = React.useState<File | null>(null);
    const [reason, setReason] = React.useState("");
    const handleImport = () => {
        if (!file || !reason) {
            alert("请上传文件并填写理由");
            return;
        }
        // TODO: 实际导入逻辑
        alert("导入成功（模拟）");
        onClose();
    };
    return (
        <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content maxWidth={450}>
                    <Dialog.Header>
                        <Dialog.Title fontSize="xl">添加banner</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Box display="flex" flexDirection="column" gap={4}>
                            <Field.Root>
                                <Field.Label fontWeight="normal">上传文件</Field.Label>
                                <Input
                                    type="file"
                                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                                />
                            </Field.Root>
                            <Field.Root>
                                <Field.Label fontWeight="normal">导入理由</Field.Label>
                                <Textarea
                                    placeholder="请输入导入理由"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </Field.Root>
                        </Box>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button onClick={onClose} mr={3} variant="ghost">取消</Button>
                        <Button colorScheme="blue" onClick={handleImport}>导入</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};
// 导出弹窗
const ExportDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [reason, setReason] = React.useState("");
    const handleExport = () => {
        if (!reason) {
            alert("请填写导出理由");
            return;
        }
        // TODO: 实际导出逻辑
        alert("导出成功（模拟）");
        onClose();
    };
    return (
        <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content maxWidth={400}>
                    <Dialog.Header>
                        <Dialog.Title fontSize="xl">导出数据</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <Box display="flex" flexDirection="column" gap={4}>
                            <Field.Root>
                                <Field.Label fontWeight="normal">导出理由</Field.Label>
                                <Textarea
                                    placeholder="请输入导出理由"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </Field.Root>
                        </Box>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button onClick={onClose} mr={3} variant="ghost">取消</Button>
                        <Button colorScheme="blue" onClick={handleExport}>导出</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
};
export default function AdminPage() {
    const [data] = useState(companyTableData);
    // 业务相关：批量操作区
    const handleBulkDelete = (rows: any[]) => {
        if (!rows.length) return;
        alert(`批量删除：${rows.length} 行（模拟）` + JSON.stringify(rows));
    };
    const [importOpen, setImportOpen] = React.useState(false);
    return (
        <Box borderRadius="lg" minHeight="full" p={4} bg="white" boxShadow="xs">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Heading size="lg">banner管理</Heading>
            </Box>
            {/* 业务相关：批量操作区通过 renderBulkActions 传递 */}
            <DataTable
                columns={columns}
                data={data}
                selectable
                renderBulkActions={rows => {
                    const hasSelection = rows.length > 0;
                    return (
                        <>
                            <ImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} />
                            <Button size="sm" colorScheme="red" onClick={() => handleBulkDelete(rows)} disabled={!hasSelection}>
                                删除
                            </Button>
                            {hasSelection && <span style={{ fontSize: 14 }}>已选 {rows.length} 行</span>}
                        </>
                    );
                }}
            />
        </Box>
    );
}