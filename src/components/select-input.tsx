"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { type Session } from "next-auth";
import { type Role } from "~/models/types";
import Link from "next/link";
import { ArrowRight, ArrowRightDarkModeFriendly } from "./svg";
import { toast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import SelectCommunicationMethod from "./select-communication-method";
import { SpinnerButton } from "./ui/button-spinner";
import type { BusinessUnit } from "@prisma/client";
import SelectBusinessUnit from "./select-businessunit";

export default function SelectRoles({
    session,
    roles,
    userSelectedRoles,
    methods,
    businessUnits,
    userSelectedBusinessUnit,
}: {
    session: Session;
    roles: Role[];
    userSelectedRoles: Role[];
    methods: string[];
    businessUnits: BusinessUnit[];
    userSelectedBusinessUnit: BusinessUnit | undefined;
}) {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const {
        mutate: setRoleMutate,
        error: setRoleError,
        isLoading: setRoleIsLoading,
    } = api.survey.setRole.useMutation();
    const { mutate: setDefaultRoleMutate, isSuccess: setDefaultRoleIsSuccess } =
        api.survey.setDefaultRole.useMutation();
    const { mutate: logUsageMetric } =
        api.usageMetricLogger.logUsageMetric.useMutation();

    // Show a toast notification on role mutation error
    useEffect(() => {
        if (setRoleError) {
            toast({
                title: "Something went wrong!",
                description: `Unable to (de)select role(s). Please try again or refresh the page.`,
                variant: "destructive",
                action: (
                    <ToastAction
                        onClick={() => {
                            setRoleMutate({
                                userId: session.user.id,
                                roleIds: selectedRoles,
                            });
                        }}
                        altText="Try again"
                    >
                        Try again
                    </ToastAction>
                ),
            });
        }
    }, [setRoleError, selectedRoles, session.user.id, setRoleMutate]);

    // Initialize selected roles from userSelectedRoles prop
    useEffect(() => {
        setSelectedRoles(userSelectedRoles.map((role) => role.id));
    }, [userSelectedRoles]);

    const handleRoleToggle = (roleId: string, isDefault: boolean) => {
        if (!isDefault && !setRoleError) {
            const index = selectedRoles.indexOf(roleId);
            let updatedRoles;
            if (index === -1) {
                updatedRoles = [...selectedRoles, roleId];
            } else {
                updatedRoles = [...selectedRoles];
                updatedRoles.splice(index, 1);
            }

            setSelectedRoles(updatedRoles);
            setRoleMutate({
                userId: session.user.id,
                roleIds: updatedRoles,
            });
        }
    };

    const handleSetGeneralRole = () => {
        setDefaultRoleMutate({
            userId: session.user.id,
            roleIds: selectedRoles,
        });
    };

    const handleLogging = () => {
        logUsageMetric({ logMessage: "find-the-expert-page-accessed" });
    };

    const [communicationMethodIsLoading, setCommunicationMethodIsLoading] =
        useState(false);

    // Redirect to /survey/general after the default role mutation succeeds
    useEffect(() => {
        if (setDefaultRoleIsSuccess) {
            window.location.href = "/survey/general";
        }
    }, [setDefaultRoleIsSuccess]);

    return (
        <div className="container mx-auto py-8">
            <h2 id="select-roles" className="mb-4 text-2xl font-bold">
                Select Roles
            </h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {roles.map((role) => (
                    <li
                        key={role.id}
                        className={`rounded-lg border p-4 ${
                            role.default
                                ? ""
                                : "cursor-pointer hover:bg-gray-400 hover:bg-opacity-25 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => handleRoleToggle(role.id, role.default)}
                    >
                        <input
                            type="checkbox"
                            className={`mr-2 ${role.default ? "" : "cursor-pointer"} accent-custom-primary`}
                            checked={
                                role.default || selectedRoles.includes(role.id)
                            }
                            onChange={() =>
                                handleRoleToggle(role.id, role.default)
                            }
                            disabled={role.default}
                        />

                        <label
                            className={role.default ? "" : "cursor-pointer"}
                            style={{ color: role.default ? "#999" : "inherit" }}
                        >
                            {role.role}
                        </label>
                    </li>
                ))}
            </ul>

            <SelectCommunicationMethod
                session={session}
                methods={methods}
                setCommunicationMethodIsLoading={
                    setCommunicationMethodIsLoading
                }
            />

            <SelectBusinessUnit
                businessUnits={businessUnits}
                userSelectedBusinessUnit={userSelectedBusinessUnit}
                session={session}
            />

            <p></p>

            <div className="mt-5 flex justify-center">
                <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
                    <div className="flex">
                        <SpinnerButton
                            onClick={handleSetGeneralRole}
                            state={
                                communicationMethodIsLoading ||
                                setRoleIsLoading ||
                                setRoleError !== null
                            }
                            name="Go to survey"
                            className="flex items-center justify-center bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
                        >
                            <Link href="/survey/general" passHref>
                                <ArrowRight />
                            </Link>
                        </SpinnerButton>
                    </div>
                    <Link href="/result?role=General">
                        <SpinnerButton
                            variant="outline"
                            className="border-2 border-[#bed62f]"
                            name="Show anonymized results"
                            state={
                                setRoleIsLoading || communicationMethodIsLoading
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
