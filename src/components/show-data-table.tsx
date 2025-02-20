"use client";
import React from "react";
import { slugify } from "~/utils/slugify";
import {
    columns,
    aggregateColumns,
    type AggregatedSurveyResult,
} from "./columns";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { useSearchParams } from "next/navigation";
import {
    aggregateDataByRole,
    groupDataByRoleAndQuestion,
    sortResults,
} from "~/utils/client-data-manipulation";
import type {
    AnswerOptionMap,
    UserAnswersForRoleArray,
    UserMap,
} from "~/models/types";
import { ChevronDown, ChevronUp } from "lucide-react";

const ShowDataTable = ({
    userAnswersForRole,
    userMap,
    answerOptionMap,
}: {
    userAnswersForRole: UserAnswersForRoleArray;
    userMap: UserMap;
    answerOptionMap: AnswerOptionMap;
}) => {
    const searchParams = useSearchParams();
    const currentRole = searchParams.get("role");

    const userMapForRole = currentRole
        ? Object.keys(userMap).reduce((acc, userId) => {
              const user = userMap[userId]!;
              if (user.roles.includes(currentRole ?? "")) {
                  acc[userId] = user;
              }
              return acc;
          }, {} as UserMap)
        : userMap;

    const dataByRoleAndQuestion = groupDataByRoleAndQuestion(
        userAnswersForRole,
        userMapForRole,
        answerOptionMap,
    );

    let aggregatedDataByRole = aggregateDataByRole(
        userAnswersForRole,
        userMapForRole,
        answerOptionMap,
    );
    aggregatedDataByRole = sortResults(aggregatedDataByRole);

    const [expandedRoles, setExpandedRoles] = React.useState<string[]>([
        Object.keys(aggregatedDataByRole)[0] ?? "",
    ]);

    const toggleRoleExpansion = (role: string) => {
        setExpandedRoles((prevExpandedRoles) => {
            if (prevExpandedRoles.includes(role)) {
                return prevExpandedRoles.filter((r) => r !== role);
            } else {
                return [...prevExpandedRoles, role];
            }
        });
    };

    return (
        <>
            {Object.keys(dataByRoleAndQuestion).length === 0 ? (
                <p>
                    There are no non-anonymous results yet. Please check back
                    later.
                </p>
            ) : (
                Object.keys(dataByRoleAndQuestion).map((role) => {
                    if (
                        !currentRole ||
                        slugify(role) === slugify(currentRole)
                    ) {
                        const isExpanded =
                            expandedRoles.includes(role) ||
                            role === currentRole;

                        return (
                            <div key={role} className="w-full">
                                <h2 className="mb-4 text-2xl font-bold">
                                    <button
                                        onClick={() =>
                                            toggleRoleExpansion(role)
                                        }
                                        className="flex items-center gap-2 hover:underline" // Added flex and gap for icon alignment
                                    >
                                        {role}
                                        {role !== currentRole ? (
                                            isExpanded ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )
                                        ) : null}
                                    </button>
                                </h2>
                                {isExpanded && (
                                    <>
                                        <h3 className="mb-3 text-lg font-semibold">
                                            Aggregated Results
                                        </h3>

                                        <DataTable<
                                            AggregatedSurveyResult,
                                            unknown
                                        >
                                            columns={aggregateColumns}
                                            data={Object.keys(
                                                aggregatedDataByRole[role] ??
                                                    {},
                                            ).map((question) => {
                                                const rowData =
                                                    aggregatedDataByRole[
                                                        role
                                                    ]?.[question];
                                                return {
                                                    name: rowData?.name ?? "",
                                                    email: question,
                                                    communicationPreferences:
                                                        rowData?.communicationPreferences ??
                                                        [],
                                                    "0":
                                                        rowData?.counts[0] ?? 0,
                                                    "1":
                                                        rowData?.counts[1] ?? 0,
                                                    "2":
                                                        rowData?.counts[2] ?? 0,
                                                    "3":
                                                        rowData?.counts[3] ?? 0,
                                                };
                                            })}
                                        />
                                        <hr className="my-10" />

                                        {Object.keys(
                                            dataByRoleAndQuestion[role] ?? {},
                                        ).map((question) => (
                                            <div key={question}>
                                                <h3 className="mb-3 text-lg font-semibold">
                                                    {question}
                                                </h3>
                                                <div className="mb-15">
                                                    <DataTable
                                                        columns={
                                                            columns as ColumnDef<{
                                                                name: string;
                                                                communicationPreferences?: string[];
                                                                answer: string;
                                                            }>[]
                                                        }
                                                        data={
                                                            dataByRoleAndQuestion[
                                                                role
                                                            ]?.[question] ?? []
                                                        }
                                                    />
                                                    <hr className="my-10" />
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        );
                    } else {
                        // Return null if role doesn't match currentRole
                        return null;
                    }
                })
            )}
        </>
    );
};

export default ShowDataTable;
