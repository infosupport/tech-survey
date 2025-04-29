"use client";
import { DataTable } from "~/components/data-tables/data-table";
import React, { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Prisma } from "@prisma/client";
import { Cross1Icon, CheckIcon, TrashIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";
import { toast } from "~/components/ui/use-toast";

type UserData = Prisma.UserGetPayload<{
    select: {
        id: true;
        name: true;
    };
}>;

const DeleteCell = ({
    row,
    onDelete,
}: {
    row: { original: UserData };
    onDelete: (id: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const { mutate: deleteUser } = api.users.deleteUser.useMutation({
        onError: (error) => {
            toast({
                title: "Something went wrong!",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const handleDelete = (id: string) => {
        deleteUser({ userId: id });
        onDelete(id);
    };

    return (
        <>
            <Popover open={open}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        <TrashIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-80"
                    onPointerDownOutside={() => setOpen(false)}
                >
                    <div className="flex justify-between space-x-4">
                        <div className="space-y-1">
                            <p className="text-sm font-normal">
                                Are you sure you want to delete{" "}
                                {row.original.name}? This action cannot be
                                undone.
                            </p>
                            <div className="flex justify-end space-x-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setOpen(false);
                                    }}
                                >
                                    <Cross1Icon className="h-4 w-4" /> Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        handleDelete(row.original.id);
                                        setOpen(false);
                                    }}
                                >
                                    <CheckIcon className="h-4 w-4" /> Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </>
    );
};

function UserDataTable({ data }: { data: UserData[] }) {
    const [userData, setUserData] = useState(data);
    const handleDelete = (id: string) => {
        setUserData((prev) => prev.filter((user) => user.id !== id));
    };

    useEffect(() => {
        setUserData(data);
    }, [data]);

    const columns: ColumnDef<UserData>[] = [
        {
            accessorKey: "name",
            header: "Name",
        },
        {
            accessorKey: "answer",
            header: "Delete",
            cell: ({ row }) => <DeleteCell row={row} onDelete={handleDelete} />,
            enableSorting: false,
        },
    ];
    return <DataTable columns={columns} data={userData} />;
}

export default UserDataTable;
