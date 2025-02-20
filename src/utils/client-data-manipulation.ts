"use client";

import type {
    AggregatedDataByRole,
    AnswerOptionMap,
    DataByRoleAndQuestion,
    Entry,
    Role,
    UserAnswersForRoleArray,
    UserMap,
} from "~/models/types";

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
        const roles = entry.question.roles;
        if (!roles || roles.length === 0) {
            continue;
        }
        for (const role of roles) {
            const roleName = getRoleName(role);
            const questionText =
                entry.question.questionText || "Unknown Question";

            initializeRoleAndQuestion(
                dataByRoleAndQuestion,
                roleName,
                questionText,
            );
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

export const aggregateDataByRole = (
    userAnswersForRole: UserAnswersForRoleArray,
    userMap: UserMap,
    answerOptionMap: AnswerOptionMap,
) => {
    const aggregatedDataByRole: AggregatedDataByRole = {};

    for (const entry of userAnswersForRole) {
        const roles = entry.question.roles;
        if (!roles || roles.length === 0) {
            continue;
        } 

        for (const role of roles) {
            const roleName = getRoleName(role);

            // Create the role if it doesn't exist
            aggregatedDataByRole[roleName] =
                aggregatedDataByRole[roleName] ?? {};

            const user = userMap[entry.userId];
            const userId = entry.userId;
            if (!user?.roles.includes(roleName)) {
                continue;
            }

            const answerValue = parseInt(
                answerOptionMap[entry.answerId] ?? "",
                10,
            );
            if (isNaN(answerValue)) {
                continue;
            }

            const { name, communicationPreferences } = user;
            if (!aggregatedDataByRole[roleName]![userId]) {
                aggregatedDataByRole[roleName]![userId] = {
                    name: name,
                    communicationPreferences: communicationPreferences ?? [],
                    counts: [0, 0, 0, 0],
                };
            }
            aggregatedDataByRole[roleName]![userId]!.counts[answerValue]++;
        }
    }

    return aggregatedDataByRole;
};

export const sortResults = (aggregatedDataByRole: AggregatedDataByRole) => {
    const sortedAggregatedDataByRole: AggregatedDataByRole = {};
    // Sorting the results based on the counts of each answer
    for (const role in aggregatedDataByRole) {
        // Sorting users based on the total count of 0 answers, then 1, 2, and 3
        const sortedEntries = Object.entries(
            aggregatedDataByRole[role] ?? {},
        ).sort((a, b) => {
            const countsA = a[1].counts;
            const countsB = b[1].counts;

            for (let i = 0; i < countsA.length; i++) {
                const diff = (countsB[i] ?? 0) - (countsA[i] ?? 0);
                if (diff !== 0) {
                    return diff;
                }
            }
            return 0;
        });
        sortedAggregatedDataByRole[role] = Object.fromEntries(sortedEntries);
    }

    return sortedAggregatedDataByRole;
};
