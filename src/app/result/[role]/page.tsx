/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { getServerAuthSession } from "~/server/auth";

import React, { Suspense } from "react";
import { db } from "~/server/db";
import { Login } from "../../../components/login";
import {
  type Role,
  type QuestionResult,
  type TransformedData,
} from "~/models/types";
import { idToAnswerMap } from "~/utils/optionMapping";
import { SelectRoleResults } from "../../../components/select-role-results";
import { slugify } from "~/utils/slugify";
import ResultsWrapper from "~/components/results";

import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
};

const Results: React.FC = async () => {
  const session = await getServerAuthSession();

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-center text-5xl font-extrabold tracking-tight">
        <span className="block text-custom-primary sm:inline">
          Info Support
        </span>
        <span className="block sm:inline"> Tech Survey - Results</span>
      </h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ShowRolesWrapper />
      </Suspense>

      <Suspense fallback={<div>Loading...</div>}>
        <ShowResultsWrapper />
      </Suspense>
      {!session && (
        <div>
          <div className="max-w-2xl text-center">
            <p>Please log in to view the results of the 2024 Tech Survey.</p>
          </div>
          <Login session={session} />
        </div>
      )}
    </div>
  );
};

const ShowRolesWrapper = async () => {
  const roles: Role[] = await db.role.findMany();

  const availableRoles = roles

    // sort roles by general first
    .sort((a, b) => {
      const roleA = a.role.toLowerCase();
      const roleB = b.role.toLowerCase();

      if (roleA === "general") return -1;
      if (roleB === "general") return 1;

      return 0;
    })
    .map((role) => ({
      id: role.id,
      href: `/result/${slugify(role.role)}`,
      label: role.role,
      current: false,
      completed: false,
      started: false,
    }));

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

  let transformedData: TransformedData = {};

  userAnswersForRole.forEach((userAnswer) => {
    const { question, answerId } = userAnswer;
    const questionText: string = question?.questionText ?? "";
    const roles: Role[] = question.roles ?? [];

    roles.forEach((role) => {
      const roleName = role?.role ?? "";
      if (
        roleName &&
        transformedData &&
        !transformedData[roleName]?.[questionText]
      ) {
        transformedData ??= {};
        transformedData[roleName] ??= {};
        transformedData![roleName]![questionText] ??= {};

        const answerString = idToAnswerMap[answerId] ?? "";
        const roleData = transformedData[roleName]?.[questionText];

        roleData![answerString] ??= 0;
        roleData![answerString]++;
      }
    });
  });

  return <ResultsWrapper data={transformedData} />;
};

export default Results;
