import type { Prisma } from "@prisma/client";
import type {
    AnswerOptionMap,
    UserIdAndAnswerId,
    UserMap,
    UserInfo,
    QuestionWithUserAnswerArray,
    DataByRoleAndQuestion,
    AggregatedDataByRole,
    Role,
    Entry,
} from "~/models/types";
import { db } from "~/server/db";

function uniqueValues<T>(array: T[]): T[] {
    return Array.from(new Set(array));
}

export const fetchUsersAndAnswerOptions = async (
    userIds: string[],
    answerIds: string[],
    userAnswersForRole: QuestionWithUserAnswerArray,
) => {
    const [users, answerOptions] = await Promise.all([
        db.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                name: true,
                communicationPreferences: {
                    select: { methods: true },
                },
                roles: {
                    select: { role: true },
                },
            },
        }),
        db.answerOption.findMany({
            where: { id: { in: answerIds } },
            select: { id: true, option: true },
        }),
    ]);

    const { userMap, answerOptionMap } = createUserAndAnswerMaps(
        users,
        answerOptions,
    );

    const dataByRoleAndQuestion = groupDataByRoleAndQuestion(
        userAnswersForRole,
        userMap,
        answerOptionMap,
    );

    let aggregatedDataByRole = aggregateDataByRole(
        userAnswersForRole,
        userMap,
        answerOptionMap,
    );
    aggregatedDataByRole = sortResults(aggregatedDataByRole);

    return {
        dataByRoleAndQuestion,
        aggregatedDataByRole,
    };
};

const sortResults = (aggregatedDataByRole: AggregatedDataByRole) => {
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

const getRoleName = (role: Role) => role.role || "Unknown Role";

const aggregateDataByRole = (
    userAnswersForRole: QuestionWithUserAnswerArray,
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

const groupDataByRoleAndQuestion = (
    questionWithUserAnswers: QuestionWithUserAnswerArray,
    userMap: UserMap,
    answerOptionMap: AnswerOptionMap,
) => {
    const dataByRoleAndQuestion: DataByRoleAndQuestion = {};

    for (const entry of questionWithUserAnswers) {
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

const createUserAndAnswerMaps = (
    users: UserInfo[],
    answerOptions: { id: string; option: number }[],
) => {
    const userMap = users.reduce((acc, user) => {
        acc[user.id] = {
            name: user.name ?? "Unknown User",
            communicationPreferences:
                user.communicationPreferences?.methods.map((method) =>
                    method.toString(),
                ) ?? [],
            roles: user.roles.map((role) => role.role),
        };
        return acc;
    }, {} as UserMap);

    const answerOptionMap = answerOptions.reduce((acc, answerOption) => {
        acc[answerOption.id] = answerOption.option.toString();
        return acc;
    }, {} as AnswerOptionMap);

    return { userMap, answerOptionMap };
};

export function extractUniqueIds(userAnswersForRole: UserIdAndAnswerId[]): {
    userIds: string[];
    answerIds: string[];
} {
    const userIds = uniqueValues(
        userAnswersForRole.map((entry) => entry.userId),
    );
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
