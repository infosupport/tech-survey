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

const staticTitle = "Find the expert - Tech Survey";

const buildStaticMetadata = (): Metadata => {
    return {
        title: staticTitle,
    };
};

const buildTitle = (userName: string | null): string => {
    if (userName === null) {
        return staticTitle;
    }

    return `${userName} - ${staticTitle}`;
};

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ userId?: string }>;
}): Promise<Metadata> {
    const userId = (await searchParams).userId;
    if (!userId) {
        return buildStaticMetadata();
    }

    const user = await prismaClient.users.getUserById(userId);
    if (!user) {
        return buildStaticMetadata();
    }

    return {
        title: buildTitle(user.name),
        openGraph: {
            title: buildTitle(user.name),
        },
    };
}

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
    const userRoles = user.roles;

    const questionCounts: Map<string, Map<string, number>> = new Map<
        string,
        Map<string, number>
    >();
    user.questionResults.forEach((questionResult) => {
        const surveyName = questionResult.question.survey.surveyName;
        questionResult.question.roles.forEach((role) => {
            const roleName = role.role;
            if (!userRoles.some((userRole) => userRole.role === roleName))
                return;
            if (!questionCounts.has(roleName)) {
                questionCounts.set(roleName, new Map<string, number>());
            }

            const roleCounts = questionCounts.get(roleName)!;
            roleCounts.set(surveyName, (roleCounts.get(surveyName) ?? 0) + 1);
        });
    });

    const surveyNames = new Set<string>();
    const radarGraphData = user.questionResults.reduce(
        (acc, questionResult) => {
            const surveyName = questionResult.question.survey.surveyName;
            surveyNames.add(surveyName);
            questionResult.question.roles.forEach((role) => {
                const roleName = role.role;
                if (!userRoles.some((userRole) => userRole.role === roleName)) {
                    return;
                }
                const answer = questionResult.answer.optionValue;
                const weight = optionWeights[answer] ?? 0;

                let roleData = acc.find((item) => item.role === roleName);
                if (!roleData) {
                    roleData = {
                        role: roleName,
                    } as ProfileRadarChartRoleData;
                    roleData[surveyName] = 0;
                    acc.push(roleData);
                }

                roleData[surveyName] = (roleData[surveyName] ?? 0) + weight;
            });

            return acc;
        },
        [] as ProfileRadarChartRoleData[],
    );

    radarGraphData.forEach((roleData) => {
        Object.keys(roleData).forEach((surveyName) => {
            if (surveyName === "role") return;
            const questionCount =
                questionCounts.get(roleData.role)?.get(surveyName) ?? 0;
            const maxScore = questionCount * 5; // Max score is number of questions * 5
            roleData[surveyName] = Math.round(
                ((roleData[surveyName] ?? 0) / maxScore) * 100,
            );
        });
    });

    const columns: ColumnDef<ProfilePageUserData["questionResults"][0]>[] = [
        {
            accessorKey: "question.questionText",
            header: "Name",
        },
        {
            accessorKey: "answer.optionValue",
            header: "Answer",
        },
    ];

    return (
        <div key={user.id} className="w-full flex-col">
            <h2 className="mb-2 text-center text-2xl font-bold">
                Profile page for {user.name}
            </h2>
            <h3 className="text-center text-lg font-semibold">
                Preferred communication methods
                <div className="flex justify-center gap-2">
                    {user.communicationPreferences?.methods.map((method) => (
                        <div key={method}>
                            {communicationMethodToIcon[method]}
                        </div>
                    ))}
                </div>
            </h3>
            {(user.communicationPreferences?.methods.length ?? 0) === 0 && (
                <p className="text-center">Do not contact</p>
            )}
            <h3 className="mb-2 mt-4 text-center text-lg font-semibold">
                Aggregated data by role
            </h3>
            <ProfileRadarChart
                roleData={radarGraphData}
                surveyNames={Array.from(surveyNames)}
            />
            <h3 className="mb-2 text-center text-lg font-semibold">
                Technology survey results
            </h3>
            <div className="grid place-content-center">
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
