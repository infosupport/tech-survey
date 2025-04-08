import React from "react";

import { type Metadata } from "next";
import UserDataTable from "~/components/user-data-table";
import SearchInput from "~/components/search-user-input";
import { auth } from "~/auth";
import { prismaClient } from "~/server/db";

export const metadata: Metadata = {
    title: "Thank You",
};

const AdministratorDashboard = async ({
    searchParams,
}: {
    searchParams: Promise<{ name: string }>;
}) => {
    const session = await auth();
    const userId = session?.user.id;
    const name = (await searchParams).name;

    if (!userId) {
        return null;
    }

    const allUsers = await prismaClient.users.getUsers();

    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                Administrator Dashboard
            </h1>
            <SearchInput />
            <div className="w-full max-w-2xl">
                <UserDataTableWrapper name={name} allUsers={allUsers} />
            </div>
        </div>
    );
};

const UserDataTableWrapper = async ({
    name,
    allUsers,
}: {
    name: string;
    allUsers: { id: string; name: string | null }[];
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
