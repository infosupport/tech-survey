import { db } from "~/server/db";
import React from "react";
import { getServerAuthSession } from "~/server/auth";

import { type Metadata } from "next";
import { redirect } from "next/navigation";
import UserDataTable from "~/components/user-data-table";
import SearchInput from "~/components/search-user-input";

export const metadata: Metadata = {
    title: "Thank You",
};

const AdministratorDashboard = async (context: {
    searchParams: { name: string };
}) => {
    const session = await getServerAuthSession();
    const user = await db.user.findFirst({
        where: {
            id: session?.user.id,
            isAdministrator: true,
        },
    });
    const userIsAdministrator = user !== null;

    if (!userIsAdministrator) {
        redirect("/");
    }

    const allUsers = await db.user.findMany({
        select: {
            id: true,
            name: true,
            isAdministrator: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                Administrator Dashboard
            </h1>
            <SearchInput />
            <div className="w-full max-w-2xl">
                <UserDataTableWrapper
                    name={context.searchParams.name}
                    allUsers={allUsers}
                />
            </div>
        </div>
    );
};

const UserDataTableWrapper = async ({
    name,
    allUsers,
}: {
    name: string;
    allUsers: { id: string; name: string | null; isAdministrator: boolean }[];
}) => {
    if (name) {
        allUsers = allUsers.filter((user) => {
            if (name === "") {
                return true;
            }
            return user.name?.toLowerCase().includes(name.toLowerCase());
        });
    }

    return <UserDataTable data={allUsers} />;
};
export default AdministratorDashboard;
