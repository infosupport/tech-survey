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
import { DataTablePagination } from "./data-table-pagination";
import {
  SlackLogo,
  TeamsLogo,
  EmailLogo,
  PhoneLogo,
  SignalLogo,
  WhatsappLogo,
} from "./svg";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

// for communication preferences, we want to show the method as an clickable icon.
// we need to map the method to an icon
const communicationMethodToIcon: Record<string, JSX.Element> = {
  SLACK: <SlackLogo />,
  EMAIL: <EmailLogo />,
  PHONE: <PhoneLogo />,
  SIGNAL: <SignalLogo />,
  TEAMS: <TeamsLogo />,
  WHATSAPP: <WhatsappLogo />,
};

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
                    <TableHead key={header.id} className="w-1/12">
                      {" "}
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
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
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell, index) => {
                    const { columnDef } = cell.column;
                    const header = columnDef?.header;
                    const cellContent: React.ReactNode =
                      typeof columnDef?.cell === "function" &&
                      (columnDef.cell(cell.getContext()) as React.ReactNode);

                    let content = null;
                    if (header === "Answer") {
                      content = idToTextMap[cellContent as number];
                    } else if (header === "Top choice for communication") {
                      console.log(cellContent);
                      if (typeof cellContent === "string") {
                        if (cellContent === "Do not contact") {
                          content = cellContent;
                        } else {
                          const individualMethods = cellContent.split(",");
                          const methodValues = individualMethods.map(
                            (individualMethod, methodIndex) => (
                              <div
                                key={`${cell.id}-method-${methodIndex}`}
                                className="flex"
                              >
                                {communicationMethodToIcon[individualMethod]}
                              </div>
                            ),
                          );
                          content = <div className="flex">{methodValues}</div>;
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
