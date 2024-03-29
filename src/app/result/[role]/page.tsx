import React, { Suspense } from "react";
import { db } from "~/server/db";
import {
  type Role,
  type QuestionResult,
  type TransformedData,
} from "~/models/types";
import { SelectRoleResults } from "../../../components/select-role-results";
import ResultsWrapper from "~/components/results";

import { type Metadata } from "next";
import ButtonSkeleton from "~/components/loading/button-loader";
import LegendSkeleton from "~/components/loading/results-loader";
import { generateRolesWithHref } from "~/utils/role-utils";

export const metadata: Metadata = {
  title: "Results",
};

const Results: React.FC = async () => {
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-center text-5xl font-extrabold tracking-tight">
        <span className="block text-custom-primary sm:inline">
          Info Support
        </span>
        <span className="block sm:inline"> Tech Survey - Results</span>
      </h1>
      <Suspense fallback={<ButtonSkeleton />}>
        <ShowRolesWrapper path="/result" />
      </Suspense>

      <Suspense fallback={<LegendSkeleton />}>
        <ShowResultsWrapper />
      </Suspense>
    </div>
  );
};

export const ShowRolesWrapper = async ({ path }: { path: string }) => {
  const availableRoles = await generateRolesWithHref(path)();

  return <SelectRoleResults roles={availableRoles} />;
};

const ShowResultsWrapper = async () => {
  // retrieve all questions and answers for all users
  const userAnswersForRole: QuestionResult[] = await db.questionResult.findMany(
    {
      include: {
        question: {
          include: {
            roles: true,
          },
        },
      },
    },
  );

  const answerOptions = await db.answerOption.findMany();

  const transformedData: TransformedData = {};

  userAnswersForRole.forEach((userAnswer) => {
    const { question, answerId } = userAnswer;
    const questionText: string = question?.questionText ?? "";
    const roles: Role[] = question.roles ?? [];

    roles.forEach((role) => {
      const roleName = role?.role ?? "";
      if (roleName && questionText) {
        // Check for existence of roleName and questionText
        transformedData[roleName] ??= {};
        transformedData[roleName]![questionText] ??= {};

        const answerString =
          answerOptions.find((option) => option.id === answerId)?.option ?? "";
        let roleData = transformedData[roleName]?.[questionText];

        // Ensure roleData is properly initialized
        if (!roleData) {
          roleData = {};
          transformedData[roleName]![questionText] = roleData;
        }

        roleData[answerString] = (roleData[answerString] ?? 0) + 1;
      }
    });
  });

  return <ResultsWrapper data={transformedData} />;
};

export default Results;
