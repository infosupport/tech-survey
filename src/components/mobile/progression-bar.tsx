import * as React from "react";
import { Button } from "~/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Section } from "~/models/types";
import Link from "next/link";
import { CheckIcon, DotFilledIcon } from "@radix-ui/react-icons";
import { ScrollArea } from "~/components/ui/scroll-area";
import { progressionInfo } from "~/utils/survey-utils";

const MobileProgressionBar = ({
    roles,
    percentCompletedPerRole,
}: {
    roles: Section[];
    percentCompletedPerRole: Record<
        string,
        { totalQuestions: number; answeredQuestions: number }
    >;
}) => {
    const { completedRoles, totalRoles, progressPercentage } = progressionInfo(
        percentCompletedPerRole,
    );
    const currentRole = roles.find((role) => role.isCurrent);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    {currentRole ? `${currentRole.label} - ` : ""}{" "}
                    {completedRoles}/{totalRoles}{" "}
                    {progressPercentage.toFixed(2)}% Completed
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Roles:</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="w-50 h-72 rounded-md border">
                    {roles.map((section) => (
                        <div key={section.id}>
                            {section.isCurrentCompleted ? (
                                <Link href={section.href}>
                                    <DropdownMenuCheckboxItem
                                        checked={section.isCurrent}
                                    >
                                        {section.isCompleted && (
                                            <div className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                                <CheckIcon className="h-4 w-4 text-green-500" />{" "}
                                            </div>
                                        )}
                                        {section.hasStarted &&
                                        !section.isCompleted ? (
                                            <div className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                                <DotFilledIcon className="h-4 w-4 text-orange-500" />{" "}
                                            </div>
                                        ) : null}
                                        {section.label}
                                    </DropdownMenuCheckboxItem>
                                </Link>
                            ) : (
                                <DropdownMenuCheckboxItem disabled>
                                    {section.isCompleted && (
                                        <div className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <CheckIcon className="h-4 w-4 text-green-500" />{" "}
                                        </div>
                                    )}
                                    {section.hasStarted &&
                                    !section.isCompleted ? (
                                        <div className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                            <DotFilledIcon className="h-4 w-4 text-orange-500" />{" "}
                                        </div>
                                    ) : null}
                                    {section.label}
                                </DropdownMenuCheckboxItem>
                            )}
                        </div>
                    ))}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export { MobileProgressionBar };
