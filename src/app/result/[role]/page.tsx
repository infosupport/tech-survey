import React, { Suspense } from "react";
import { db } from "~/server/db";
import {
  type Section,
  type QuestionResult,
  type TransformedData,
} from "~/models/types";
import ResultsWrapper from "~/components/results";

import { type Metadata } from "next";
import ButtonSkeleton from "~/components/loading/button-loader";
import LegendSkeleton from "~/components/loading/results-loader";
import { generateRolesWithHref } from "~/utils/role-utils";
import { getServerAuthSession } from "~/server/auth";
import { Login } from "~/components/login";
import ShowTechSearchWrapper from "~/components/ui/search-expert";
import { SelectRoleResults } from "~/components/select-role-results";

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
      {!session && (
        <>
          <p className="text-center text-lg">
            Unable to view anonymized results without logging in.
          </p>
          <Login session={session} text={"Log in"} />
        </>
      )}
      {session && (
        <>
          <Suspense fallback={<ButtonSkeleton />}>
            <ShowRolesWrapper path="/result" />
          </Suspense>

          <Suspense fallback={<LegendSkeleton />}>
            <ShowResultsWrapper />
          </Suspense>
        </>
      )}
    </div>
  );
};

export const ShowRolesWrapper = async ({ path }: { path: string }) => {
  const availableRoles = await generateRolesWithHref(path)();
  const def = {
    id: "",
    href: path,
    label: "No role",
    current: false,
    completed: false,
    started: false,
    currentCompleted: false
  };
  availableRoles.unshift(def as Section);
  if (path.includes("result")) {
    return (
      <SelectRoleResults roles={availableRoles} />
    )
  }
  return (
      <ShowTechSearchWrapper roles={availableRoles} />
  );
};

const ShowResultsWrapper = async () => {
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

  userAnswersForRole.forEach(({ question, answerId }) => {
    const questionText = question?.questionText ?? "";
    const roles = question?.roles ?? [];

    roles.forEach(({ role: roleName = "" }) => {
      if (roleName && questionText) {
        transformedData[roleName] ??= {};
        transformedData[roleName]![questionText] ??= {};

        const answerString =
          answerOptions.find(({ id }) => id === answerId)?.option ?? "";
        transformedData[roleName]![questionText]![answerString] =
          (transformedData[roleName]![questionText]![answerString] ?? 0) + 1;
      }
    });
  });

  return <ResultsWrapper data={transformedData} />;
};

export default Results;
