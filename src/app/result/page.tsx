import React, { Suspense } from "react";
import { db } from "~/server/db";
import {
  type QuestionResult,
  type TransformedData,
  type Section,
} from "~/models/types";
import { SelectRoleResults } from "../../components/select-role-results";
import ResultsWrapper from "~/components/results";

import { type Metadata } from "next";
import ButtonSkeleton from "~/components/loading/button-loader";
import LegendSkeleton from "~/components/loading/results-loader";
import { generateRolesWithHref } from "~/utils/role-utils";
import { getServerAuthSession } from "~/server/auth";
import { Login } from "~/components/login";
import SearchAnonymized from "~/components/ui/search-anonymized";
import type { BusinessUnit } from "@prisma/client";

export const metadata: Metadata = {
  title: "Results",
};

const Results = async (context: { searchParams: {role:string, unit:string}}) => {
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
            <ShowResultsWrapper role={context.searchParams.role} unit={context.searchParams.unit}/>
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
  if (path.includes("expert")) {
    return (
      <SelectRoleResults roles={availableRoles} />
    )
  }

  const availableUnits = await db.businessUnit.findMany();
  const defaultUnit = {
    id: "",
    unit: "No unit"
  };
  availableUnits.unshift(defaultUnit as BusinessUnit);

  return (
      <SearchAnonymized roles={availableRoles} businessUnits={availableUnits}/>
  )
};

const FetchQuestionResults = async ({role, unit} : {role:string, unit:string}) => {
  if (role != undefined && unit == undefined) {
    return await db.questionResult.findMany(
      {
        where: {
          question: {
            roles: {
              some: {
                role: {
                  equals: role,
                  mode: "insensitive"
                }
              }
            }
          }
        },
        include: {
          question: {
            include: {
              roles: true,
            },
          },
        },
      },
    );
  }

  if (role == undefined && unit != undefined) {
    return await db.questionResult.findMany(
      {
        where: {
          user: {
            businessUnit: {
              unit: {
                equals: unit,
                mode: "insensitive"
              }
            }
          }
        },
        include: {
          question: {
            include: {
              roles: true,
            },
          },
        },
      }
    )
  }

  if (role != undefined && unit != undefined) {
    return await db.questionResult.findMany(
      {
        where: {
          user: {
            businessUnit: {
              unit: {
                equals: unit,
                mode: "insensitive"
              }
            }
          },
          question: {
            roles: {
              some: {
                role: {
                  equals: role,
                  mode: "insensitive"
                }
              }
            }
          }
        },
        include: {
          question: {
            include: {
              roles: true,
            },
          },
        },
      }
    )
  }
  return [];
}

const ShowResultsWrapper = async ({role, unit} : {role:string, unit:string}) => {
  const userAnswersForRole: QuestionResult[] = await FetchQuestionResults({role,unit});
  const answerOptions = await db.answerOption.findMany();

  const transformedData: TransformedData = {};

  userAnswersForRole.forEach(({ question, answerId }) => {
    const questionText = question?.questionText ?? "";
    const roles = question?.roles ?? [];

    if (role != undefined) {
      roles.forEach(({ role: roleName = "" }) => {
        if (roleName && questionText && roleName == role) {
          transformedData[roleName] ??= {};
          transformedData[roleName]![questionText] ??= {};

          const answerString =
            answerOptions.find(({ id }) => id === answerId)?.option ?? "";
          transformedData[roleName]![questionText]![answerString] =
            (transformedData[roleName]![questionText]![answerString] ?? 0) + 1;     
        }      
      }); 
    } else if (unit != undefined) {
      transformedData[unit] ??= {};
      transformedData[unit]![questionText] ??= {};

      const answerString =
        answerOptions.find(({ id }) => id === answerId)?.option ?? "";
      transformedData[unit]![questionText]![answerString] =
        (transformedData[unit]![questionText]![answerString] ?? 0) + 1;  
    }
  });

  return <ResultsWrapper data={transformedData} />;
};

export default Results;
