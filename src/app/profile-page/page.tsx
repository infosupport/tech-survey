import type { Metadata } from "next";
import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import React, { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import { getServerAuthSession } from "~/server/auth";
import ProfilePageSearch from "~/components/ui/profile-page-search";
import { db } from "~/server/db";
import { DataTable } from "~/components/data-tables/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import communicationMethodToIcon from "~/components/ui/CommunicationMethodToIcon";

export const metadata: Metadata = {
    title: "Find the expert",
};

const LoginSection = ({ session }: { session: Session | null }) => (
    <>
        <p className="text-center text-lg">
            Unable to search people without logging in.
        </p>
        <Login session={session} text={"Log in"} />
    </>
);

const ContentSection = async ({ name }: { name: string }) => {
    const users = await db.user.findMany({
        select: userSelect,
    });

    const selectedUser = users.find((user) => user.name === name);

    return (
        <>
            <Suspense fallback={<ButtonSkeleton />}>
                <ProfilePageSearch allUsers={users} />
            </Suspense>
            <Suspense fallback={<ButtonSkeleton />}>
                {name ? (
                    <ProfilePage user={selectedUser} />
                ) : (
                    <h3 className="text-center text-lg font-semibold">
                        Type a name to start searching
                    </h3>
                )}
            </Suspense>
        </>
    );
};

const userSelect = {
    name: true,
    id: true,
    questionResults: {
        orderBy: {
            answer: {
                option: "asc",
            },
        },
        select: {
            answer: {
                select: {
                    option: true,
                },
            },
            question: {
                select: {
                    questionText: true,
                    roles: {
                        select: {
                            role: true,
                        },
                    },
                },
            },
        },
    },
    communicationPreferences: {
        select: {
            methods: true,
        },
    },
} satisfies Prisma.UserSelect;

export type UserData = Prisma.UserGetPayload<{
    select: typeof userSelect;
}>;

const ProfilePage = async ({ user }: { user?: UserData }) => {
    if (!user) {
        return (
            <h3 className="text-center text-lg font-semibold">No user found</h3>
        );
    }

    const userDataByRole = user.questionResults.reduce(
        (acc, questionResult) => {
            questionResult.question.roles.forEach((role) => {
                if (!acc[role.role]) {
                    acc[role.role] = {};
                }

                if (!acc[role.role]![questionResult.answer.option]) {
                    acc[role.role]![questionResult.answer.option] = 0;
                }

                acc[role.role]![questionResult.answer.option]++;
            });

            return acc;
        },
        {} as Record<string, Record<string, number>>,
    );

    const columns: ColumnDef<UserData["questionResults"][0]>[] = [
        {
            accessorKey: "question.questionText",
            header: "Name",
        },
        {
            accessorKey: "answer.option",
            header: "Answer",
        },
    ];

    const aggregatedColumns = [
        {
            accessorKey: "role",
            header: "Role",
        },
        {
            accessorKey: "0",
            header: "🤗 Expert",
        },
        {
            accessorKey: "1",
            header: "😏 Competent",
        },
        {
            accessorKey: "2",
            header: "👷‍♀️ Novice & Would like to learn",
        },
        {
            accessorKey: "3",
            header: "🤷‍♂️ Novice / Don’t know",
        },
    ];

    return (
        <div>
            <div key={user.id}>
                <h2 className="text-center text-2xl font-bold">
                    Profile page for {user.name}
                </h2>
                <h3 className="text-center text-lg font-semibold">
                    Preferred communication methods
                    <div className="flex justify-center gap-2">
                        {user.communicationPreferences?.methods.map(
                            (method) => (
                                <div key={method}>
                                    {communicationMethodToIcon[method]}
                                </div>
                            ),
                        )}
                    </div>
                </h3>
                <h3 className="text-center text-lg font-semibold">
                    Aggregated data by role
                </h3>
                <DataTable
                    columns={aggregatedColumns}
                    data={Object.keys(userDataByRole).map((role) => {
                        const rowData = userDataByRole[role] ?? {};
                        return {
                            role,
                            "0": rowData["0"] ?? 0,
                            "1": rowData["1"] ?? 0,
                            "2": rowData["2"] ?? 0,
                            "3": rowData["3"] ?? 0,
                        };
                    })}
                />
                <h3 className="text-center text-lg font-semibold">
                    Technology survey results
                </h3>
                <DataTable columns={columns} data={user.questionResults} />
            </div>
        </div>
    );
};
const ProfilePageWrapper = async (context: {
    searchParams: { name: string };
}) => {
    const session = await getServerAuthSession();

    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                <span className="block text-custom-primary sm:inline">
                    Info Support
                </span>
                <span className="block sm:inline">
                    {" "}
                    Tech Survey - Profile page
                </span>
            </h1>
            {session ? (
                <ContentSection name={context.searchParams.name} />
            ) : (
                <LoginSection session={session} />
            )}
        </div>
    );
};

export default ProfilePageWrapper;
