"use client";

import React from "react";
import { slugify } from "~/utils/slugify";
import { columns } from "./columns";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { usePathname } from "next/navigation";

type ShowDataTableProps = {
  dataByRoleAndQuestion: Record<
    string,
    Record<string, { name: string; email: string; answer: string }[]>
  >;
};

const ShowDataTable: React.FC<ShowDataTableProps> = ({
  dataByRoleAndQuestion,
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
