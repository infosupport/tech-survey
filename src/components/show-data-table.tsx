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
import { usePathname } from "next/navigation";

type ShowDataTableProps = {
  dataByRoleAndQuestion: Record<
    string,
    Record<string, { name: string; email: string; answer: string }[]>
  >;
  aggregatedDataByRole: Record<
    string,
    Record<
      string,
      {
        name: string;
        counts: number[];
      }
    >
  >;
};

const ShowDataTable: React.FC<ShowDataTableProps> = ({
  dataByRoleAndQuestion,
  aggregatedDataByRole,
}) => {
  const pathname = usePathname() || "";

  const currentRole = pathname.split("/").pop() ?? "";
  return (
    <>
      {Object.keys(dataByRoleAndQuestion).map((role) => {
        if (slugify(role) === currentRole) {
          return (
            <div key={role}>
              <h2 className="mb-4 text-2xl font-bold">{role}</h2>

              <DataTable<AggregatedSurveyResult, unknown>
                columns={aggregateColumns}
                data={Object.keys(aggregatedDataByRole[role] ?? {}).map(
                  (question) => {
                    const rowData = aggregatedDataByRole[role]?.[question];
                    return {
                      name: rowData?.name ?? "",
                      email: question,
                      "0": rowData?.counts[0] ?? 0,
                      "1": rowData?.counts[1] ?? 0,
                      "2": rowData?.counts[2] ?? 0,
                      "3": rowData?.counts[3] ?? 0,
                    };
                  },
                )}
              />

              {Object.keys(dataByRoleAndQuestion[role] ?? {}).map(
                (question) => (
                  <div key={question}>
                    <h3 className="mb-3 text-lg font-semibold">{question}</h3>
                    <div className="mb-15">
                      <DataTable
                        columns={
                          columns as ColumnDef<
                            { name: string; email: string; answer: string },
                            unknown
                          >[]
                        }
                        data={dataByRoleAndQuestion[role]?.[question] ?? []}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          );
        } else {
          return null; // Return null if role doesn't match currentRole
        }
      })}
    </>
  );
};

export default ShowDataTable;
