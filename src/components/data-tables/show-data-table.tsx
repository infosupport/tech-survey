"use client";
import React from "react";
import { slugify } from "~/utils/slugify";
import {
    columns,
    aggregateColumns,
    type AggregatedSurveyResult,
} from "~/components/columns";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "~/components/data-tables/data-table";
import { useSearchParams } from "next/navigation";
import type {
    AggregatedDataByRole,
    DataByRoleAndQuestion,
} from "~/models/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import DataTableTitle from "~/components/data-tables/data-table-title";
import { clsx } from "clsx";

const ShowDataTable = ({
    dataByRoleAndQuestionForRole,
    aggregatedDataByRole,
}: {
    dataByRoleAndQuestionForRole: DataByRoleAndQuestion;
    aggregatedDataByRole: AggregatedDataByRole;
}) => {
    const searchParams = useSearchParams();
    const currentRole = searchParams.get("role");
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
            {Object.keys(dataByRoleAndQuestionForRole).length === 0 ? (
                <p>
                    There are no non-anonymous results yet. Please check back
                    later.
                </p>
            ) : (
                Object.keys(dataByRoleAndQuestionForRole).map((role) => {
                    const roleIsCurrentRole = role === currentRole;
                    const isExpanded =
                        expandedRoles.includes(role) || roleIsCurrentRole;

                    return (
                        <div key={role} className="w-full">
                            <h2 className="mb-4 text-2xl font-bold">
                                <button
                                    onClick={() =>
                                        !roleIsCurrentRole &&
                                        toggleRoleExpansion(role)
                                    }
                                    className={clsx(
                                        "flex items-center gap-2 ",
                                        {
                                            "hover:underline":
                                                !roleIsCurrentRole,
                                            "cursor-text": roleIsCurrentRole,
                                        },
                                    )}
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
                                    <DataTableTitle text="Aggregated Results" />

                                    <DataTable<AggregatedSurveyResult, unknown>
                                        columns={aggregateColumns}
                                        data={Object.keys(
                                            aggregatedDataByRole[role] ?? {},
                                        ).map((question) => {
                                            const rowData =
                                                aggregatedDataByRole[role]?.[
                                                    question
                                                ];
                                            return {
                                                name: rowData?.name ?? "",
                                                email: question,
                                                communicationPreferences:
                                                    rowData?.communicationPreferences ??
                                                    [],
                                                "0": rowData?.counts[0] ?? 0,
                                                "1": rowData?.counts[1] ?? 0,
                                                "2": rowData?.counts[2] ?? 0,
                                                "3": rowData?.counts[3] ?? 0,
                                            };
                                        })}
                                    />
                                    <hr className="my-10" />

                                    {Object.keys(
                                        dataByRoleAndQuestionForRole[role] ??
                                            {},
                                    ).map((question) => (
                                        <div key={question}>
                                            <DataTableTitle text={question} />
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
                                                        dataByRoleAndQuestionForRole[
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
                })
            )}
        </>
    );
};

export default ShowDataTable;
