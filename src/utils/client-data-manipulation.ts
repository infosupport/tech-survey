"use client";

import type { $Enums } from "@prisma/client";
import type {
  AggregatedDataByRole,
  AnswerOptionMap,
  DataByRoleAndQuestion,
  Entry,
  Role,
  UserAnswersForRoleArray,
  UserMap,
} from "~/models/types";

export const createUserAndAnswerMaps = (
  users: {
    id: string;
    name: string | null;
    email: string | null;
    communicationPreferences: {
      id: string;
      userId: string;
      methods: $Enums.CommunicationMethod[];
    }[];
    roles: { id: string; role: string }[];
  }[],
  answerOptions: { id: string; option: number }[],
) => {
  const userMap: UserMap = {};
  for (const user of users) {
    userMap[user.id] = {
      name: user.name ?? "Unknown User",
      email: user.email ?? "Unknown Email",
      communicationPreferences: user.communicationPreferences.map((method) =>
        method.methods.toString(),
      ),
      roles: user.roles.map((role) => role.role),
    };
  }

  const answerOptionMap: AnswerOptionMap = {};
  for (const answerOption of answerOptions) {
    answerOptionMap[answerOption.id] =
      answerOption.option.toString() ?? "Unknown Answer";
  }

  return { userMap, answerOptionMap };
};

// Helper function to initialize role and question in the data structure
const initializeRoleAndQuestion = (
  dataByRoleAndQuestion: DataByRoleAndQuestion,
  roleName: string,
  questionText: string,
): void => {
  if (!dataByRoleAndQuestion[roleName]) {
    dataByRoleAndQuestion[roleName] = {};
  }
  if (!dataByRoleAndQuestion[roleName]![questionText]) {
    dataByRoleAndQuestion[roleName]![questionText] = [];
  }
};

// Helper function to push user data into the data structure
const pushUserData = (
  dataByRoleAndQuestion: DataByRoleAndQuestion,
  roleName: string,
  questionText: string,
  entry: Entry,
  userMap: UserMap,
  answerOptionMap: AnswerOptionMap,
): void => {

  // do nothing if there is no user data
  if (!userMap[entry.userId]?.roles.includes(roleName)) {
    return;
  }

  dataByRoleAndQuestion[roleName]![questionText]!.push({
    name: userMap[entry.userId]?.name ?? "Unknown User",
    email: userMap[entry.userId]?.email ?? "Unknown Email",
    communicationPreferences: userMap[
      entry.userId
    ]!.communicationPreferences?.some((pref) => pref.trim().length > 0)
      ? userMap[entry.userId]?.communicationPreferences
      : ["Do not contact"],
    answer: answerOptionMap[entry.answerId] ?? "Unknown Answer",
    roles: userMap[entry.userId]?.roles ?? [],
  });
};

const sortUserData = (
  dataByRoleAndQuestion: DataByRoleAndQuestion,
  roleName: string,
  questionText: string,
): void => {
  dataByRoleAndQuestion[roleName]![questionText]!.sort((a, b) => {
    const answerValueA = parseInt(a.answer);
    const answerValueB = parseInt(b.answer);

    // We don't want the same person be appear on top of the table all the time. So we shuffle the order of the users with the same answer value.
    if (answerValueA === answerValueB) {
      return Math.random() - 0.5;
    } else {
      return answerValueA - answerValueB;
    }
  });
};

export const groupDataByRoleAndQuestion = (
  userAnswersForRole: UserAnswersForRoleArray,
  userMap: UserMap,
  answerOptionMap: AnswerOptionMap,
) => {
  const dataByRoleAndQuestion: DataByRoleAndQuestion = {};

  for (const entry of userAnswersForRole) {
    for (const role of entry.question.roles ?? []) {
      const roleName = role.role || "Unknown Role";
      const questionText = entry.question.questionText || "Unknown Question";

      initializeRoleAndQuestion(dataByRoleAndQuestion, roleName, questionText);
      pushUserData(
        dataByRoleAndQuestion,
        roleName,
        questionText,
        entry,
        userMap,
        answerOptionMap,
      );
      sortUserData(dataByRoleAndQuestion, roleName, questionText);
    }
  }

  return dataByRoleAndQuestion;
};

const getRoleName = (role: Role) => role.role || "Unknown Role";

const initializeRole = (
  aggregatedDataByRole: AggregatedDataByRole,
  roleName: string,
) => {
  if (!aggregatedDataByRole[roleName]) {
    aggregatedDataByRole[roleName] = {};
  }
};

const getUserDetails = (userMap: UserMap, entry: Entry) => {
  const userName = userMap[entry.userId]?.name ?? "Unknown User";
  const userEmail = userMap[entry.userId]?.email ?? "Unknown Email";
  let userCommunicationPreferences =
    userMap[entry.userId]?.communicationPreferences;
  userCommunicationPreferences = userCommunicationPreferences?.some(
    (pref) => pref.trim().length > 0,
  )
    ? userCommunicationPreferences
    : ["Do not contact"];
  return { userName, userEmail, userCommunicationPreferences };
};

const initializeUser = (
  aggregatedDataByRole: AggregatedDataByRole,
  roleName: string,
  userEmail: string,
  userName: string,
  userCommunicationPreferences: string[],
) => {
  if (!aggregatedDataByRole[roleName]![userEmail]) {
    aggregatedDataByRole[roleName]![userEmail] = {
      name: userName,
      communicationPreferences: userCommunicationPreferences ?? [],
      counts: [0, 0, 0, 0],
    };
  }
};

const updateCounts = (
  aggregatedDataByRole: AggregatedDataByRole,
  roleName: string,
  userEmail: string,
  answerValue: number,
) => {
  if (!aggregatedDataByRole[roleName]![userEmail]?.counts[answerValue]) {
    aggregatedDataByRole[roleName]![userEmail]!.counts[answerValue] = 0;
  }
  aggregatedDataByRole[roleName]![userEmail]!.counts[answerValue] =
    (aggregatedDataByRole[roleName]![userEmail]?.counts[answerValue] ?? 0) + 1;
};

export const aggregateDataByRole = (
  userAnswersForRole: UserAnswersForRoleArray,
  userMap: UserMap,
  answerOptionMap: AnswerOptionMap,
) => {
  const aggregatedDataByRole: AggregatedDataByRole = {};

  for (const entry of userAnswersForRole) {
    for (const role of entry.question.roles ?? []) {
      const roleName = getRoleName(role);
      initializeRole(aggregatedDataByRole, roleName);

      if (userMap[entry.userId]?.roles.includes(roleName)) {
        const answerValue = parseInt(answerOptionMap[entry.answerId] ?? "", 10);
        const { userName, userEmail, userCommunicationPreferences } =
          getUserDetails(userMap, entry);
        initializeUser(
          aggregatedDataByRole,
          roleName,
          userEmail,
          userName,
          userCommunicationPreferences,
        );

        if (!isNaN(answerValue)) {
          updateCounts(aggregatedDataByRole, roleName, userEmail, answerValue);
        }
      }
    }
  }

  return aggregatedDataByRole;
};

export const sortResults = (aggregatedDataByRole: AggregatedDataByRole) => {
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

  return aggregatedDataByRole;
};
