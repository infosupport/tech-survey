import { Suspense } from "react";
import {
    type QuestionResult,
    type Role,
    type TransformedData,
} from "~/models/types";
import { prismaClient } from "~/server/db";

import type { BusinessUnit } from "~/prisma";
import { type Metadata } from "next";
import ButtonSkeleton from "~/components/loading/button-loader";
import LegendSkeleton from "~/components/loading/results-loader";
import SearchAnonymized from "~/components/ui/search-anonymized";
import ShowResults from "~/components/show-results";
import { sortRoles } from "~/utils/role-utils";

export const metadata: Metadata = {
    title: "Results",
};

export default async function Results(context: {
    searchParams: Promise<{ role: string; unit: string }>;
}) {
    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                <span className="block text-custom-primary sm:inline">
                    Info Support
                </span>
                <span className="block sm:inline"> Tech Survey - Results</span>
            </h1>
            <Suspense fallback={<ButtonSkeleton />}>
                <AnonymousRoleSearch />
            </Suspense>

            <Suspense fallback={<LegendSkeleton />}>
                <ShowResultsWrapper
                    roleId={(await context.searchParams).role}
                    unitId={(await context.searchParams).unit}
                />
            </Suspense>
        </div>
    );
}

async function AnonymousRoleSearch() {
    const availableRoles = sortRoles(await prismaClient.roles.getAll());
    const availableUnits = await prismaClient.businessUnits.getAll();

    const def: Role = {
        id: "",
        isDefault: true,
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

const ShowResultsWrapper = async ({
    roleId,
    unitId,
}: {
    roleId: string | null;
    unitId: string | null;
}) => {
    const userAnswersForRole: QuestionResult[] =
        await prismaClient.questionResults.getResultPageData(roleId, unitId);
    const answerOptions = await prismaClient.answerOptions.getAll();

    const transformedData: TransformedData = {};

    userAnswersForRole.forEach(({ question, answerId }) => {
        const questionText = question?.questionText ?? "";
        const roles = question?.roles ?? [];

        if (roleId !== null) {
            roles.forEach(({ role: roleName = "" }) => {
                if (roleName && questionText && roleName === roleId) {
                    transformedData[roleName] ??= {};
                    transformedData[roleName][questionText] ??= {};

                    const answerString =
                        answerOptions.find(({ id }) => id === answerId)
                            ?.optionValue ?? "";
                    transformedData[roleName][questionText][answerString] =
                        (transformedData[roleName][questionText][
                            answerString
                        ] ?? 0) + 1;
                }
            });
        } else if (unitId !== null) {
            transformedData[unitId] ??= {};
            transformedData[unitId][questionText] ??= {};

            const answerString =
                answerOptions.find(({ id }) => id === answerId)?.optionValue ??
                "";
            transformedData[unitId][questionText][answerString] =
                (transformedData[unitId][questionText][answerString] ?? 0) + 1;
        }
    });

    return <ShowResults data={transformedData} />;
};
