import type { Metadata } from "next";
import type { Session } from "next-auth";

import { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import ShowDataTable from "~/components/show-data-table";
import { getServerAuthSession } from "~/server/auth";
import {
    extractUniqueIds,
    fetchUserAnswers,
    fetchUsersAndAnswerOptions,
} from "~/utils/data-manipulation";
import { getRoles } from "~/utils/role-utils";
import { db } from "~/server/db";
import ShowTechSearchWrapper from "~/components/ui/show-tech-search-wrapper";

export const metadata: Metadata = {
    title: "Find the expert",
};

const LoginSection = ({ session }: { session: Session | null }) => (
    <>
        <p className="text-center text-lg">
            Unable to find experts without logging in.
        </p>
        <Login session={session} text={"Log in"} />
    </>
);

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
    searchParams: { role: string; tech: string; unit: string };
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
                    Tech Survey - Find the expert
                </span>
            </h1>
            {session ? (
                <ContentSection
                    role={context.searchParams.role}
                    tech={context.searchParams.tech}
                    unit={context.searchParams.unit}
                />
            ) : (
                <LoginSection session={session} />
            )}
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
    const userAnswersForRole = await fetchUserAnswers({
        role,
        questionText: tech,
        unit,
    });

    const { userIds, answerIds } = extractUniqueIds(userAnswersForRole);
    const { userMap, answerOptionMap } = await fetchUsersAndAnswerOptions(
        userIds,
        answerIds,
    );

    return (
        <ShowDataTable
            userAnswersForRole={userAnswersForRole}
            userMap={userMap}
            answerOptionMap={answerOptionMap}
        />
    );
};

export default FindTheExpertPage;
