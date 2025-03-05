import type { Metadata } from "next";
import { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import ShowDataTable from "~/components/data-tables/show-data-table";
import { retrieveAnswersByRole } from "~/utils/data-manipulation";
import { getRoles } from "~/utils/role-utils";
import { db } from "~/server/db";
import ShowTechSearchWrapper from "~/components/ui/show-tech-search-wrapper";

export const metadata: Metadata = {
    title: "Find the expert",
};

const ContentSection = ({
    role,
    tech,
    unit,
}: {
    role: string;
    tech: string;
    unit: string;
}) => (
    <>
        <Suspense fallback={<ButtonSkeleton />}>
            <FindTheExpertSearch />
        </Suspense>
        <Suspense fallback={<ButtonSkeleton />}>
            <ShowTableWrapper tech={tech} role={role} unit={unit} />
        </Suspense>
    </>
);

const FindTheExpertSearch = async () => {
    const availableRoles = await getRoles()();
    const availableUnits = await db.businessUnit.findMany();

    return (
        <ShowTechSearchWrapper
            roles={availableRoles}
            businessUnits={availableUnits}
        />
    );
};

const FindTheExpertPage = async (context: {
    searchParams: Promise<{ role: string; tech: string; unit: string }>;
}) => {
    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                <span className="block text-custom-primary sm:inline">
                    Info Support
                </span>
                <span className="block sm:inline">
                    {" "}
                    Tech Survey - Find the expert
                </span>
            </h1>
            <ContentSection
                role={(await context.searchParams).role}
                tech={(await context.searchParams).tech}
                unit={(await context.searchParams).unit}
            />
        </div>
    );
};

const ShowTableWrapper = async ({
    tech,
    role,
    unit,
}: {
    tech: string;
    role: string;
    unit: string;
}) => {
    const { dataByRoleAndQuestion, aggregatedDataByRole } =
        await retrieveAnswersByRole({
            role,
            questionText: tech,
            unit,
        });

    return (
        <ShowDataTable
            dataByRoleAndQuestion={dataByRoleAndQuestion}
            aggregatedDataByRole={aggregatedDataByRole}
        />
    );
};

export default FindTheExpertPage;
