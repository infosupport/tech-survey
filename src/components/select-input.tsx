"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { type Role } from "~/models/types";
import Link from "next/link";
import { ArrowRightDarkModeFriendly } from "~/components/svg";
import SelectCommunicationMethod from "~/components/select-communication-method";
import { SpinnerButton } from "~/components/ui/button-spinner";
import type { BusinessUnit, CommunicationMethod } from "~/prisma";
import SelectBusinessUnit from "~/components/select-businessunit";
import CommunicationPreferencesSelectionSkeleton from "~/components/loading/communication-preferences-selection-loader";
import { useRouter } from "next/navigation";
import SelectRoles from "~/components/select-roles";

function SelectUserSurveyPreferences({
    userId,
    roles,
    businessUnits,
}: {
    userId: string;
    roles: Role[];
    businessUnits: BusinessUnit[];
}) {
    const { data: user, isLoading } = api.users.getUserInfo.useQuery(
        { userId: userId },
        { enabled: !!userId },
    );
    const userSelectedBusinessUnit = user?.businessUnit ?? undefined;
    const communicationPreferences = user?.communicationPreferences;
    const [methods, setMethods] = useState<CommunicationMethod[]>(
        communicationPreferences?.methods ?? [],
    );

    useEffect(() => {
        setMethods(communicationPreferences?.methods ?? []);
    }, [communicationPreferences]);

    const { mutate: setDefaultRoleMutate, isSuccess: setDefaultRoleIsSuccess } =
        api.users.setDefaultRoleForUser.useMutation();
    const { mutate: logUsageMetric } =
        api.usageMetricLogger.logUsageMetric.useMutation();
    const router = useRouter();

    const handleLogging = () => {
        logUsageMetric({ logMessage: "find-the-expert-page-accessed" });
    };

    const [communicationMethodIsLoading, setCommunicationMethodIsLoading] =
        useState(false);
    const [roleIsLoading, setRoleIsLoading] = useState(false);

    // Redirect to /survey/general after the default role mutation succeeds
    useEffect(() => {
        if (setDefaultRoleIsSuccess) {
            router.push("/survey/general");
        }
    }, [router, setDefaultRoleIsSuccess]);

    const handleSetGeneralRole = () => {
        setDefaultRoleMutate({
            userId: userId,
        });
    };

    return (
        <div className="container mx-auto py-8">
            <SelectRoles
                allRoles={roles}
                userId={userId}
                userRoles={user?.roles ?? []}
                setRoleIsLoading={setRoleIsLoading}
            />

            {isLoading ? (
                <CommunicationPreferencesSelectionSkeleton />
            ) : (
                <SelectCommunicationMethod
                    userId={userId}
                    methods={methods}
                    setCommunicationMethodIsLoading={
                        setCommunicationMethodIsLoading
                    }
                />
            )}

            <SelectBusinessUnit
                businessUnits={businessUnits}
                userSelectedBusinessUnit={userSelectedBusinessUnit}
                userId={userId}
            />

            <p></p>

            <div className="mt-5 flex justify-center">
                <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
                    <div className="flex">
                        <SpinnerButton
                            onClick={handleSetGeneralRole}
                            state={
                                communicationMethodIsLoading || roleIsLoading
                            }
                            name="Go to survey"
                            className="flex items-center justify-center bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
                        >
                            <Link href="/survey/general" passHref>
                                <ArrowRightDarkModeFriendly />
                            </Link>
                        </SpinnerButton>
                    </div>
                    <Link href="/result?role=General">
                        <SpinnerButton
                            variant="outline"
                            className="border-2 border-[#bed62f]"
                            name="Show anonymized results"
                            state={
                                roleIsLoading || communicationMethodIsLoading
                            }
                        >
                            <ArrowRightDarkModeFriendly />
                        </SpinnerButton>
                    </Link>
                    <Link href="/find-the-expert">
                        <SpinnerButton
                            onClick={handleLogging}
                            state={communicationMethodIsLoading}
                            variant="outline"
                            className="border-2 border-[#bed62f]"
                            name="Find the Expert"
                        >
                            <ArrowRightDarkModeFriendly />
                        </SpinnerButton>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SelectUserSurveyPreferences;
