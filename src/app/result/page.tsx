import { Suspense } from "react";
import ResultsWrapper from "~/components/results";
import {
    type QuestionResult,
    type Role,
    type TransformedData,
} from "~/models/types";
import { db } from "~/server/db";

import type { BusinessUnit, Prisma } from "@prisma/client";
import { type Metadata } from "next";
import ButtonSkeleton from "~/components/loading/button-loader";
import LegendSkeleton from "~/components/loading/results-loader";
import { Login } from "~/components/login";
import SearchAnonymized from "~/components/ui/search-anonymized";
import { getServerAuthSession } from "~/server/auth";
import { getRoles } from "~/utils/role-utils";

export const metadata: Metadata = {
    title: "Results",
};

const Results = async (context: {
    searchParams: Promise<{ role: string; unit: string }>;
}) => {
    const session = await getServerAuthSession();
    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                <span className="block text-custom-primary sm:inline">
                    Info Support
                </span>
                <span className="block sm:inline"> Tech Survey - Results</span>
            </h1>
            {!session && (
                <>
                    <p className="text-center text-lg">
                        Unable to view anonymized results without logging in.
                    </p>
                    <Login session={session} text={"Log in"} />
                </>
            )}
            {session && (
                <>
                    <Suspense fallback={<ButtonSkeleton />}>
                        <AnonymousRoleSearch />
                    </Suspense>

                    <Suspense fallback={<LegendSkeleton />}>
                        <ShowResultsWrapper
                            role={(await context.searchParams).role}
                            unit={(await context.searchParams).unit}
                        />
                    </Suspense>
                </>
            )}
        </div>
    );
};

export async function AnonymousRoleSearch() {
    const availableRoles = await getRoles()();
    const availableUnits = await db.businessUnit.findMany();

    const def: Role = {
        id: "",
        default: true,
        role: "No role",
    };
    availableRoles.unshift(def);

    const defaultUnit: BusinessUnit = {
        id: "",
        unit: "No unit",
    };
    availableUnits.unshift(defaultUnit);

    return (
        <SearchAnonymized
            roles={availableRoles}
            businessUnits={availableUnits}
        />
    );
}

const FetchQuestionResults = async ({
    role,
    unit,
}: {
    role: string;
    unit: string;
}) => {
    // If both role and unit are undefined, return an empty array
    if (!role && !unit) return [];

    // Base include object reused in all queries
    const includeConfig = {
        question: {
            include: {
                roles: true,
            },
        },
    };

    // Dynamically build the where conditions
    const whereConditions: Prisma.QuestionResultWhereInput = {};

    if (role) {
        whereConditions.question = {
            roles: {
                some: {
                    role: {
                        equals: role,
                        mode: "insensitive",
                    },
                },
            },
        };
    }

    if (unit) {
        whereConditions.user = {
            businessUnit: {
                unit: {
                    equals: unit,
                    mode: "insensitive",
                },
            },
        };
    }

    return db.questionResult.findMany({
        where: whereConditions,
        include: includeConfig,
    });
};

const ShowResultsWrapper = async ({
    role,
    unit,
}: {
    role: string;
    unit: string;
}) => {
    const userAnswersForRole: QuestionResult[] = await FetchQuestionResults({
        role,
        unit,
    });
    const answerOptions = await db.answerOption.findMany();

    const transformedData: TransformedData = {};

    userAnswersForRole.forEach(({ question, answerId }) => {
        const questionText = question?.questionText ?? "";
        const roles = question?.roles ?? [];

        if (role != undefined) {
            roles.forEach(({ role: roleName = "" }) => {
                if (roleName && questionText && roleName == role) {
                    transformedData[roleName] ??= {};
                    transformedData[roleName][questionText] ??= {};

                    const answerString =
                        answerOptions.find(({ id }) => id === answerId)
                            ?.option ?? "";
                    transformedData[roleName][questionText][answerString] =
                        (transformedData[roleName][questionText][
                            answerString
                        ] ?? 0) + 1;
                }
            });
        } else if (unit != undefined) {
            transformedData[unit] ??= {};
            transformedData[unit][questionText] ??= {};

            const answerString =
                answerOptions.find(({ id }) => id === answerId)?.option ?? "";
            transformedData[unit][questionText][answerString] =
                (transformedData[unit][questionText][answerString] ?? 0) + 1;
        }
    });

    return <ResultsWrapper data={transformedData} />;
};

export default Results;
