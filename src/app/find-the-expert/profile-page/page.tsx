import type { Metadata } from "next";
import React, { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import ProfilePageSearch from "~/components/ui/profile-page-search";
import { prismaClient } from "~/server/db";
import { DataTable } from "~/components/data-tables/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import communicationMethodToIcon from "~/components/ui/communication-method-to-icon";
import ProfileRadarChart from "~/components/profile-radar-chart";
import type { ProfilePageUserData } from "~/server/db/prisma-client/user";

export const metadata: Metadata = {
    title: "Find the expert",
};

const ContentSection = async ({ userId }: { userId?: string }) => {
    const users = await prismaClient.users.getUsers();
    const selectedUser = userId
        ? await prismaClient.users.getProfilePageUserById(userId)
        : null;
    const currentSurveyId = await prismaClient.surveys.getLatestSurveyId();

    return (
        <>
            <Suspense fallback={<ButtonSkeleton />}>
                <ProfilePageSearch users={users} />
            </Suspense>
            <Suspense fallback={<ButtonSkeleton />}>
                {selectedUser !== null ? (
                    <ProfilePage
                        currentSurveyId={currentSurveyId}
                        user={selectedUser}
                    />
                ) : (
                    <h3 className="text-center text-lg font-semibold">
                        Type a name to start searching
                    </h3>
                )}
            </Suspense>
        </>
    );
};

const optionWeights: Record<number, number> = {
    0: 5,
    1: 3,
    2: 1,
    3: 0,
};

const ProfilePage = async ({
    currentSurveyId,
    user,
}: {
    currentSurveyId: string | null;
    user?: ProfilePageUserData;
}) => {
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

    const columns: ColumnDef<ProfilePageUserData["questionResults"][0]>[] = [
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
                <DataTable
                    columns={columns}
                    data={user.questionResults.filter(
                        (qr) => qr.question.survey.id === currentSurveyId,
                    )}
                />
            </div>
        </div>
    );
};
const ProfilePageWrapper = async (context: {
    searchParams: Promise<{ userId: string }>;
}) => {
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
            <ContentSection userId={(await context.searchParams).userId} />
        </div>
    );
};

export default ProfilePageWrapper;
