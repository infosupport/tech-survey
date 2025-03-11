import type { Metadata } from "next";
import React, { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import ProfilePageSearch from "~/components/ui/profile-page-search";
import { prismaClient } from "~/server/db";
import { DataTable } from "~/components/data-tables/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import communicationMethodToIcon from "~/components/ui/communication-method-to-icon";
import ProfileRadarChart, {
    type ProfileRadarChartRoleData,
} from "~/components/profile-radar-chart";
import type { ProfilePageUserData } from "~/server/db/prisma-client/user";

export const metadata: Metadata = {
    title: "Find the expert",
};

const ContentSection = async ({ userId }: { userId?: string }) => {
    const users = await prismaClient.users.getUsers();
    const selectedUser = userId
        ? await prismaClient.users.getProfilePageUserById(userId)
        : null;

    return (
        <>
            <Suspense fallback={<ButtonSkeleton />}>
                <ProfilePageSearch users={users} />
            </Suspense>
            <Suspense fallback={<ButtonSkeleton />}>
                {selectedUser !== null ? (
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

const optionWeights: Record<number, number> = {
    0: 5,
    1: 3,
    2: 1,
    3: 0,
};

const buildRoleData = (
    roleName: string,
    surveyName: string,
    weight: number,
): ProfileRadarChartRoleData => {
    const result = {
        role: roleName,
    } as ProfileRadarChartRoleData;
    result[surveyName] = weight;

    return result;
};

const ProfilePage = async ({ user }: { user?: ProfilePageUserData }) => {
    if (!user) {
        return (
            <h3 className="text-center text-lg font-semibold">No user found</h3>
        );
    }

    const surveyNames = new Set<string>();
    const radarGraphData = user.questionResults.reduce(
        (acc, questionResult) => {
            const surveyName = questionResult.question.survey.surveyName;
            surveyNames.add(surveyName);
            questionResult.question.roles.forEach((role) => {
                const roleName = role.role;
                const answer = questionResult.answer.option;
                const weight = optionWeights[answer] ?? 0;

                let roleData = acc.find((item) => item.role === roleName);
                if (!roleData) {
                    roleData = buildRoleData(roleName, surveyName, 0);
                    acc.push(roleData);
                }

                roleData[surveyName] = (roleData[surveyName] || 0) + weight;
            });

            return acc;
        },
        [] as ProfileRadarChartRoleData[],
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
                        <ProfileRadarChart
                            roleData={radarGraphData}
                            surveyNames={Array.from(surveyNames)}
                        />
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
