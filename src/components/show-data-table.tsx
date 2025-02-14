"use client";
import type { $Enums } from "@prisma/client";
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
  createUserAndAnswerMaps,
  groupDataByRoleAndQuestion,
  sortResults,
} from "~/utils/client-data-manipulation";
import type { UserAnswersForRoleArray } from "~/models/types";

const ShowDataTable = ({
  userAnswersForRole,
  users,
  answerOptions,
}: {
  userAnswersForRole: UserAnswersForRoleArray;
  users: {
    name: string | null;
    id: string;
    roles: {
      id: string;
      role: string;
      default: boolean;
    }[];
    email: string | null;
    communicationPreferences: {
      id: string;
      userId: string;
      methods: $Enums.CommunicationMethod[];
    } | null;
  }[];
  answerOptions: { id: string; option: number }[];
}) => {
  const searchParams=useSearchParams();
  const currentRole = searchParams.get("role");

  const usersForRole: typeof users = currentRole !== null ? users.filter((user) =>
    user.roles.some((role) => slugify(role.role) === slugify(currentRole)),
  ) : users;

  const { userMap, answerOptionMap } = createUserAndAnswerMaps(
    usersForRole,
    answerOptions,
  );

  const dataByRoleAndQuestion = groupDataByRoleAndQuestion(
    userAnswersForRole,
    userMap,
    answerOptionMap,
  );

  const aggregatedDataByRole = aggregateDataByRole(
    userAnswersForRole,
    userMap,
    answerOptionMap,
  );
  sortResults(aggregatedDataByRole);

  return (
    <>
      {Object.keys(dataByRoleAndQuestion).length === 0 ? (
        <p>There are no non-anonymous results yet. Please check back later.</p>
      ) : (
        Object.keys(dataByRoleAndQuestion).map((role) => {
          if (!currentRole || slugify(role) === slugify(currentRole)) {
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
