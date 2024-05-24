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
        communicationPreferences: string[];
        counts: number[];
      }
    >
  >;
};

const ShowDataTable: React.FC<ShowDataTableProps> = ({
  dataByRoleAndQuestion,
  aggregatedDataByRole,
}) => {
  const pathname = usePathname();

  const currentRole = pathname.split("/").pop();
  return (
    <>
      {Object.keys(dataByRoleAndQuestion).length === 0 ? (
        <p>There are no non-anonymous results yet. Please check back later.</p>
      ) : (
        Object.keys(dataByRoleAndQuestion).map((role) => {
          if (slugify(role) === currentRole) {
            return (
              <div key={role}>
                <h2 className="mb-4 text-2xl font-bold">{role}</h2>
                <h3 className="mb-3 text-lg font-semibold">
                  Aggregated Results
                </h3>

                <DataTable<AggregatedSurveyResult, unknown>
                  columns={aggregateColumns}
                  data={Object.keys(aggregatedDataByRole[role] ?? {}).map(
                    (question) => {
                      const rowData = aggregatedDataByRole[role]?.[question];
                      return {
                        name: rowData?.name ?? "",
                        email: question,
                        communicationPreferences:
                          rowData?.communicationPreferences ?? [],
                        "0": rowData?.counts[0] ?? 0,
                        "1": rowData?.counts[1] ?? 0,
                        "2": rowData?.counts[2] ?? 0,
                        "3": rowData?.counts[3] ?? 0,
                      };
                    },
                  )}
                />
                <hr className="my-10" />

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
                        <hr className="my-10" />
                      </div>
                    </div>
                  ),
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
