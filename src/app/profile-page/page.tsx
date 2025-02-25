import type { Metadata } from "next";
import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import React, { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import { getServerAuthSession } from "~/server/auth";
import ProfilePageSearch from "~/components/ui/profile-page-search";
import { db } from "~/server/db";
import { DataTable } from "~/components/data-table";
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

const ContentSection = ({ name }: { name: string }) => (
    <>
        <Suspense fallback={<ButtonSkeleton />}>
            <ProfilePageSearch />
        </Suspense>
        <Suspense fallback={<ButtonSkeleton />}>
            {name ? (
                <ProfilePage name={name} />
            ) : (
                <h3 className="text-center text-lg font-semibold">
                    Type a name to start searching
                </h3>
            )}
        </Suspense>
    </>
);

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

type UserData = Prisma.UserGetPayload<{
    select: typeof userSelect;
}>;

const ProfilePage = async ({ name }: { name: string }) => {
    const users = await db.user.findMany({
        where: {
            name: {
                contains: name,
                mode: "insensitive",
            },
        },
        select: userSelect,
    });

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
            {users.map((user) => {
                return (
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
                        <DataTable
                            columns={columns}
                            data={user.questionResults}
                        />
                    </div>
                );
            })}
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
