import type { UserIdAndAnswerId } from "~/models/types";
import { db } from "~/server/db";

export const fetchUserAnswersForRole = async () => {
  return await db.questionResult.findMany({
    include: {
      question: {
        include: {
          roles: true,
        },
      },
    },
  });
};

export const fetchUsersAndAnswerOptions = async (
  userIds: string[],
  answerIds: string[],
) => {
  return await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        communicationPreferences: true,
        roles: true,
      },
    }),
    db.answerOption.findMany({
      where: { id: { in: answerIds } },
      select: { id: true, option: true },
    }),
  ]);
};

function uniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function extractUniqueIds(userAnswersForRole: UserIdAndAnswerId[]): {
  userIds: string[];
  answerIds: string[];
} {
  const userIds = uniqueValues(userAnswersForRole.map((entry) => entry.userId));
  const answerIds = uniqueValues(
    userAnswersForRole.map((entry) => entry.answerId),
  );
  return { userIds, answerIds };
}
