import type { Prisma } from "@prisma/client";
import type { UserIdAndAnswerId } from "~/models/types";
import { db } from "~/server/db";

function uniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

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

export interface FetchUserAnswersParams {
  role?: string;
  questionText?: string;
  unit?: string;
}

export const fetchUserAnswers = async ({
  role,
  questionText,
  unit,
}: FetchUserAnswersParams = {}) => {
  // 1. Build up a QuestionWhereInput object
  const questionWhere: Prisma.QuestionWhereInput = {};

  if (role) {
    questionWhere.roles = {
      some: {
        role: {
          equals: role,
          mode: "insensitive",
        },
      },
    };
  }

  if (questionText) {
    questionWhere.questionText = {
      contains: questionText,
      mode: "insensitive",
    };
  }

  // 2. Build up a UserWhereInput object
  const userWhere: Prisma.UserWhereInput = {};

  if (unit) {
    userWhere.businessUnit = {
      unit: {
        equals: unit,
        mode: "insensitive",
      },
    };
  }

  // 3. Build the final `where` for QuestionResult
  //    Only attach `question` or `user` if they're non-empty
  const where: Prisma.QuestionResultWhereInput = {};
  if (Object.keys(questionWhere).length > 0) {
    where.question = questionWhere;
  }
  if (Object.keys(userWhere).length > 0) {
    where.user = userWhere;
  }

  // 4. Run the query
  return db.questionResult.findMany({
    where,
    include: {
      question: {
        include: {
          roles: true,
        },
      },
      user: true,
    },
  });
};
