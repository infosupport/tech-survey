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

export type AggregatedSurveyResult = {
  name: string;
  email: string;
  0: number;
  1: number;
  2: number;
  3: number;
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

export const aggregateColumns: ColumnDef<AggregatedSurveyResult>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "0",
    header: "🤗 Expert",
  },
  {
    accessorKey: "1",
    header: "😏 Competent",
  },
  {
    accessorKey: "2",
    header: "👷‍♀️ Novice & Would like to learn",
  },
  {
    accessorKey: "3",
    header: "🤷‍♂️ Novice / Don’t know",
  },
];
