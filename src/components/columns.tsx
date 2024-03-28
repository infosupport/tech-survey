"use client";

import { type ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type SurveyResult = {
  id: string;
  name: string;
  email: string;
  answer: string;
};

export const columns: ColumnDef<SurveyResult>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "answer",
    header: "Answer",
  },
];
