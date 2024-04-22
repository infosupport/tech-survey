import type { Metadata } from "next";
import { Suspense } from "react";
import { ShowRolesWrapper } from "~/app/result/[role]/page";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import ShowDataTable from "~/components/show-data-table";
import type { DataByRoleAndQuestion, QuestionResult } from "~/models/types";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

export const metadata: Metadata = {
  title: "Find the expert",
};

const FindTheExpertPage = async () => {
  const session = await getServerAuthSession();
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-center text-5xl font-extrabold tracking-tight">
        <span className="block text-custom-primary sm:inline">
          Info Support
        </span>
        <span className="block sm:inline"> Tech Survey - Find the expert</span>
      </h1>
      {!session && (
        <>
          <p className="text-center text-lg">
            Unable to find experts without logging in.
          </p>
          <Login session={session} text={"Log in"} />
        </>
      )}
      {session && (
        <>
          <Suspense fallback={<ButtonSkeleton />}>
            <ShowRolesWrapper path="/find-the-expert" />
          </Suspense>
          <Suspense fallback={<ButtonSkeleton />}>
            <ShowTableWrapper />
          </Suspense>
        </>
      )}
    </div>
  );
};

const ShowTableWrapper = async () => {
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

  // Extract all unique user IDs and answer IDs
  const userIds = Array.from(
    new Set(userAnswersForRole.map((entry) => entry.userId)),
  );
  const answerIds = Array.from(
    new Set(userAnswersForRole.map((entry) => entry.answerId)),
  );

  // Fetch all users and answer options in a single query
  const [users, answerOptions] = await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
    db.answerOption.findMany({
      where: { id: { in: answerIds } },
      select: { id: true, option: true },
    }),
  ]);

  // Create a map of user IDs to user objects for easy lookup
  const userMap: Record<string, { name: string; email: string }> = {};
  for (const user of users) {
    userMap[user.id] = {
      name: user.name ?? "Unknown User",
      email: user.email ?? "Unknown Email",
    };
  }

  // Create a map of answer IDs to answer option objects for easy lookup
  const answerOptionMap: Record<string, string> = {};
  for (const answerOption of answerOptions) {
    answerOptionMap[answerOption.id] =
      answerOption.option.toString() ?? "Unknown Answer";
  }

  // Group the data by roles and questions
  const dataByRoleAndQuestion: DataByRoleAndQuestion = {};

  for (const entry of userAnswersForRole) {
    for (const role of entry.question.roles ?? []) {
      const roleName = role.role || "Unknown Role";
      const questionText = entry.question.questionText || "Unknown Question";

      if (!dataByRoleAndQuestion[roleName]) {
        dataByRoleAndQuestion[roleName] = {};
      }
      if (!dataByRoleAndQuestion[roleName]![questionText]) {
        dataByRoleAndQuestion[roleName]![questionText] = [];
      }

      dataByRoleAndQuestion[roleName]?.[questionText]?.push({
        name: userMap[entry.userId]?.name ?? "Unknown User",
        email: userMap[entry.userId]?.email ?? "Unknown Email",
        answer: answerOptionMap[entry.answerId] ?? "Unknown Answer",
      });

      // Sort the answers based on the answer value (0, 1, 2, or 3)
      dataByRoleAndQuestion[roleName]?.[questionText]?.sort((a, b) => {
        const answerValueA = parseInt(a.answer);
        const answerValueB = parseInt(b.answer);
        return answerValueA - answerValueB;
      });
    }
  }

  const aggregatedDataByRole: Record<
    string,
    Record<string, { name: string; counts: number[] }>
  > = {};

  for (const entry of userAnswersForRole) {
    for (const role of entry.question.roles ?? []) {
      const roleName = role.role || "Unknown Role";

      if (!aggregatedDataByRole[roleName]) {
        aggregatedDataByRole[roleName] = {};
      }

      const answerValue = parseInt(answerOptionMap[entry.answerId] ?? "");
      const userName = userMap[entry.userId]?.name ?? "Unknown User";
      const userEmail = userMap[entry.userId]?.email ?? "Unknown Email";

      if (!isNaN(answerValue)) {
        if (!aggregatedDataByRole[roleName]?.[userEmail]) {
          aggregatedDataByRole[roleName]![userEmail] = {
            name: userName,
            counts: [0, 0, 0, 0],
          };
        }
        aggregatedDataByRole[roleName]![userEmail]!.counts[answerValue]++;
      }
    }
  }

  // Sorting the results based on the counts of each answer
  for (const role in aggregatedDataByRole) {
    for (const user in aggregatedDataByRole[role]) {
      const counts = aggregatedDataByRole[role]![user]?.counts ?? [0, 0, 0, 0];
      aggregatedDataByRole[role]![user]!.counts = counts;
    }
  }

  // Sorting users based on the total count of 0 answers, then 1, 2, and 3
  for (const role in aggregatedDataByRole) {
    const sortedEntries = Object.entries(aggregatedDataByRole[role] ?? {}).sort(
      (a, b) => {
        const countsA = a[1].counts;
        const countsB = b[1].counts;
        for (let i = 0; i < countsA.length; i++) {
          const diff = (countsB[i] ?? 0) - (countsA[i] ?? 0);
          if (diff !== 0) {
            return diff;
          }
        }
        return 0;
      },
    );
    aggregatedDataByRole[role] = Object.fromEntries(sortedEntries);
  }

  return (
    <ShowDataTable
      dataByRoleAndQuestion={dataByRoleAndQuestion}
      aggregatedDataByRole={aggregatedDataByRole}
    />
  );
};

export default FindTheExpertPage;
