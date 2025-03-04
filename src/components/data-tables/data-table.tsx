"use client";

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { idToTextMap } from "~/utils/optionMapping";
import { DataTablePagination } from "~/components/data-tables/data-table-pagination";
import communicationMethodToIcon from "~/components/ui/CommunicationMethodToIcon";

import type { JSX } from "react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-slate-100 dark:bg-slate-900">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="w-1/12"
                                        >
                                            {" "}
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={`${row.id}-${Math.random()}`}
                                    data-state={
                                        row.getIsSelected()
                                            ? "selected"
                                            : undefined
                                    }
                                >
                                    {row
                                        .getVisibleCells()
                                        .map((cell, index) => {
                                            const { columnDef } = cell.column;
                                            const header = columnDef?.header;
                                            const cellContent: React.ReactNode =
                                                typeof columnDef?.cell ===
                                                    "function" &&
                                                (columnDef.cell(
                                                    cell.getContext(),
                                                ) as React.ReactNode);

                                            let content = null;
                                            if (header === "Answer") {
                                                content =
                                                    idToTextMap[
                                                        cellContent as number
                                                    ];
                                            } else if (
                                                header ===
                                                "Top choice for communication"
                                            ) {
                                                if (
                                                    typeof cellContent ===
                                                    "string"
                                                ) {
                                                    if (
                                                        cellContent ===
                                                        "Do not contact"
                                                    ) {
                                                        content = cellContent;
                                                    } else {
                                                        const individualMethods =
                                                            cellContent.split(
                                                                ",",
                                                            );
                                                        const methodValues =
                                                            individualMethods.map(
                                                                (
                                                                    individualMethod,
                                                                    methodIndex,
                                                                ) => (
                                                                    <div
                                                                        key={`${cell.id}-method-${methodIndex}`}
                                                                        className="flex"
                                                                    >
                                                                        {
                                                                            communicationMethodToIcon[
                                                                                individualMethod
                                                                            ]
                                                                        }
                                                                    </div>
                                                                ),
                                                            );
                                                        content = (
                                                            <div className="flex">
                                                                {methodValues}
                                                            </div>
                                                        );
                                                    }
                                                }
                                            } else {
                                                content = cellContent;
                                            }

                                            return (
                                                <TableCell
                                                    key={`${cell.id}-${index}`}
                                                    className="w-[400px] pl-2"
                                                >
                                                    {content}
                                                </TableCell>
                                            );
                                        })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}
