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
import ProfileRadarChart from "~/components/profile-radar-chart";

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
                    survey: {
                        select: {
                            surveyName: true,
                        },
                    },
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

const optionWeights: Record<number, number> = {
    0: 5,
    1: 3,
    2: 1,
    3: 0,
};

const ProfilePage = async ({ user }: { user?: UserData }) => {
    if (!user) {
        return (
            <h3 className="text-center text-lg font-semibold">No user found</h3>
        );
    }

    const radarGraphData = user.questionResults.reduce(
        (acc, questionResult) => {
            questionResult.question.roles.forEach((role) => {
                const roleName = role.role;
                const answer = questionResult.answer.option;
                const weight = optionWeights[answer] ?? 0;

                const existingRoleData = acc.find(
                    (item) => item.role === roleName,
                );

                if (existingRoleData) {
                    existingRoleData.sum += weight;
                } else {
                    acc.push({ role: roleName, sum: weight });
                }
            });

            return acc;
        },
        [] as { role: string; sum: number }[],
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

    return (
        <div>
            <div key={user.id}>
                <h2 className="mb-2 text-center text-2xl font-bold">
                    Profile page for {user.name}
                </h2>
                <h3 className="mb-2 text-center text-lg font-semibold">
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
                <h3 className="mb-2 text-center text-lg font-semibold">
                    Aggregated data by role
                </h3>
                <div className="mb-4">
                    <div className="chart-container">
                        <ProfileRadarChart data={radarGraphData} />
                    </div>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold">
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
