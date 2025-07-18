"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    IconButton,
    Input,
    Text,
    Portal,
    Table,
    Menu, Checkbox, NativeSelect, Pagination, ButtonGroup,
    Separator,
} from "@chakra-ui/react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    type ColumnPinningState,
} from "@tanstack/react-table";
import {
    FiChevronLeft,
    FiChevronRight,
    FiArrowUp,
    FiArrowDown,
    FiEye,
    FiCornerUpLeft,
    FiCornerUpRight,
    FiMoreVertical,
} from "react-icons/fi";

interface DataTableProps<T extends object> {
    columns: ColumnDef<T, any>[];
    data: T[];
    selectable?: boolean;
    pageCount?: number;
    manualPagination?: boolean;
    manualSorting?: boolean;
    manualFiltering?: boolean;
    onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
    onSortingChange?: (sorting: SortingState) => void;
    onFilterChange?: (filter: string) => void;
    renderBulkActions?: (selectedRows: T[]) => React.ReactNode;
}


// 在 DataTableProps 和 DataTable 组件实现中，不再包含任何 action 列或业务 cell 渲染
const DataTable = <T extends object>({
    columns,
    data,
    selectable = false,
    pageCount,
    manualPagination = false,
    manualSorting = false,
    manualFiltering = false,
    onPaginationChange,
    onSortingChange,
    onFilterChange,
    renderBulkActions,
}: DataTableProps<T>) => {
    const [rowSelection, setRowSelection] = useState({});
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ left: [], right: [] });
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    // 触发父组件回调
    useEffect(() => {
        if (manualPagination && onPaginationChange) {
            onPaginationChange(pagination);
        }
    }, [pagination.pageIndex, pagination.pageSize]);
    useEffect(() => {
        if (manualSorting && onSortingChange) {
            onSortingChange(sorting);
        }
    }, [JSON.stringify(sorting)]);
    useEffect(() => {
        if (manualFiltering && onFilterChange) {
            onFilterChange(globalFilter);
        }
    }, [globalFilter]);

    const table = useReactTable({
        data,
        columns,
        enableRowSelection: selectable,
        enablePinning: true,
        state: {
            rowSelection,
            pagination,
            columnPinning,
            columnVisibility,
            sorting,
            globalFilter,
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        onColumnPinningChange: setColumnPinning,
        onColumnVisibilityChange: setColumnVisibility,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            // 简单全局搜索
            return Object.values(row.original).some((v) =>
                String(v).toLowerCase().includes(String(filterValue).toLowerCase())
            );
        },
        manualPagination,
        manualSorting,
        manualFiltering,
        pageCount: manualPagination && pageCount !== undefined ? pageCount : undefined,
    });

    const selectedRows: T[] = table.getSelectedRowModel().rows.map((r: any) => r.original);

    // 工具栏
    const Toolbar = () => (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Input
                placeholder="搜索..."
                size="sm"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                flex={1}
                minWidth={0}
            />
            <ColumnVisibilityMenu table={table} />
            {renderBulkActions?.(selectedRows)}
        </Box>
    );


    // 列显示/隐藏菜单
    const ColumnVisibilityMenu: React.FC<{ table: any }> = ({ table }) => {
        const allColumns = table.getAllLeafColumns();
        const allVisible = allColumns.every((col: any) => col.getIsVisible());
        return (
            <Menu.Root closeOnSelect={false}>
                <Menu.Trigger asChild>
                    <Button
                        variant="outline"
                        rounded="md"
                        size="sm"
                        aspectRatio="square"
                    >
                        <FiEye style={{ height: "16px", width: "16px" }} />
                    </Button>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner width={200}>
                        <Menu.Content>
                            <Menu.ItemGroup>
                                <Menu.ItemGroupLabel>表格列</Menu.ItemGroupLabel>
                                <Separator />
                                <Menu.Item>
                                    <Checkbox.Root
                                        checked={table.getIsAllColumnsVisible()}
                                        onCheckedChange={table.getToggleAllColumnsVisibilityHandler()}
                                        size="sm"
                                    >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                        <Checkbox.Label>所有列</Checkbox.Label>
                                    </Checkbox.Root>
                                </Menu.Item>
                                {table.getAllColumns().map((column, index: number) => (
                                    <Menu.Item asChild key={index}>
                                        <Checkbox.Root
                                            id={`visibility-${column.id}`}
                                            checked={column.getIsVisible()}
                                            onCheckedChange={() => column.toggleVisibility()}
                                            size="sm"
                                        >
                                            <Checkbox.HiddenInput />
                                            <Checkbox.Control />
                                            <Checkbox.Label>
                                                {column?.columnDef?.header}
                                            </Checkbox.Label>
                                        </Checkbox.Root>
                                    </Menu.Item>
                                ))}
                            </Menu.ItemGroup>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>

        );
    };

    // 表头菜单（排序、固定等）
    const HeaderMenu = ({ header, table }: { header: any; table: any }) => {
        return (
            <Menu.Root>
                <Menu.Trigger asChild>
                    <IconButton
                        aria-label="更多"
                        size="xs"
                        variant="ghost"
                    >
                        <FiMoreVertical />
                    </IconButton>
                </Menu.Trigger>
                <Menu.Positioner width={140}>
                    <Menu.Content>
                        <Menu.Item value="asc" onClick={() => table.setSorting([{ id: header.column.id, desc: false }])}>
                            <FiArrowUp style={{ marginRight: 4 }} />升序
                        </Menu.Item>
                        <Menu.Item value="desc" onClick={() => table.setSorting([{ id: header.column.id, desc: true }])}>
                            <FiArrowDown style={{ marginRight: 4 }} />降序
                        </Menu.Item>
                        <Menu.Item value="pinLeft" onClick={() => header.column.pin(header.column.getIsPinned() ? false : "left")}>
                            <FiCornerUpLeft style={{ marginRight: 4 }} />{header.column.getIsPinned() === "left" ? "取消固定" : "固定左侧"}
                        </Menu.Item>
                        <Menu.Item value="pinRight" onClick={() => header.column.pin(header.column.getIsPinned() === "right" ? false : "right")}>
                            <FiCornerUpRight style={{ marginRight: 4 }} />{header.column.getIsPinned() === "right" ? "取消固定" : "固定右侧"}
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Menu.Root>
        );
    };

    // Ark UI Pagination
    const PaginationBar = () => (
        <Pagination.Root
            count={manualPagination && pageCount !== undefined ? pageCount * table.getState().pagination.pageSize : data.length}
            pageSize={table.getState().pagination.pageSize}
            defaultPage={table.getState().pagination.pageIndex + 1}
            mt={3}
            display="flex"
            justifyContent="space-between"
            fontSize={13}
        >
            <Box display="flex" flexWrap="nowrap" alignItems="center" gap={2}>
                <Text textWrap="nowrap">每页</Text>
                <NativeSelect.Root
                    value={String(table.getState().pagination.pageSize)}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    size="sm"
                    fontSize={13}
                >
                    <NativeSelect.Field>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Text textWrap="nowrap">条</Text>
            </Box>
            <ButtonGroup variant="ghost" size="sm">
                <Pagination.PrevTrigger asChild>
                    <IconButton aria-label="上一页">
                        <FiChevronLeft />
                    </IconButton>
                </Pagination.PrevTrigger>
                <Pagination.Items
                    render={page => (
                        <IconButton
                            key={page.value}
                            variant={page.selected ? "outline" : "ghost"}
                            aria-label={`第${page.value}页`}
                            onClick={() => table.setPageIndex(page.value - 1)}
                        >
                            {page.value}
                        </IconButton>
                    )}
                />
                <Pagination.NextTrigger asChild>
                    <IconButton aria-label="下一页">
                        <FiChevronRight />
                    </IconButton>
                </Pagination.NextTrigger>
            </ButtonGroup>
        </Pagination.Root>
    );

    return (
        <Box>
            <Toolbar />
            <Box overflowX="auto">
                <Table.Root
                    variant="outline"
                    size="sm"
                    borderWidth={1}
                >
                    <Table.Header>
                        {table.getHeaderGroups().map(headerGroup => (
                            <Table.Row key={headerGroup.id}>
                                {selectable && (
                                    <Table.ColumnHeader>
                                        <input
                                            type="checkbox"
                                            checked={table.getIsAllRowsSelected()}
                                            onChange={table.getToggleAllRowsSelectedHandler()}
                                        />
                                    </Table.ColumnHeader>
                                )}
                                {headerGroup.headers.map(header => (
                                    <Table.ColumnHeader
                                        key={header.id}
                                        position={header.column.getIsPinned() ? "sticky" : undefined}
                                        left={header.column.getIsPinned() === "left" ? 0 : undefined}
                                        zIndex={header.column.getIsPinned() ? 2 : 1}
                                    >
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getCanSort() && header.column.id !== 'action' && (
                                                <IconButton
                                                    aria-label="排序"
                                                    size="xs"
                                                    variant="ghost"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {header.column.getIsSorted() === "asc" ? <FiArrowUp /> : header.column.getIsSorted() === "desc" ? <FiArrowDown /> : <FiArrowUp style={{ opacity: 0.3 }} />}
                                                </IconButton>
                                            )}
                                            {header.column.id !== 'action' && < HeaderMenu header={header} table={table} />}
                                        </Box>
                                    </Table.ColumnHeader>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Header>
                    <Table.Body>
                        {table.getRowModel().rows.map(row => (
                            <Table.Row key={row.id}>
                                {selectable && (
                                    <Table.Cell>
                                        <input
                                            type="checkbox"
                                            checked={row.getIsSelected()}
                                            onChange={row.getToggleSelectedHandler()}
                                        />
                                    </Table.Cell>
                                )}
                                {row.getVisibleCells().map(cell => (
                                    <Table.Cell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table.Root>
            </Box>
            <PaginationBar />
        </Box>
    );
};

export default DataTable; 