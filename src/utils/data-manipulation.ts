import type { Prisma } from "@prisma/client";
import type {
    DataByRoleAndQuestion,
    AggregatedDataByRole,
    Role,
} from "~/models/types";
import { db } from "~/server/db";

type QuestionResultWithRelations = Prisma.QuestionResultGetPayload<{
    include: {
        question: {
            include: {
                roles: true;
            };
        };
        user: {
            select: {
                id: true;
                name: true;
                communicationPreferences: {
                    select: { methods: true };
                };
                roles: {
                    select: { role: true };
                };
            };
        };
        answer: {
            select: {
                id: true;
                option: true;
            };
        };
    };
}>;

export const fetchAnswerData = async ({
    role,
    questionText,
    unit,
}: {
    role?: string;
    questionText?: string;
    unit?: string;
}) => {
    const where = buildWhereClause({ role, questionText, unit });

    const questionResults = await db.questionResult.findMany({
        where,
        include: {
            question: {
                include: {
                    roles: true,
                },
            },
            user: {
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
            },
            answer: {
                select: {
                    id: true,
                    option: true,
                },
            },
        },
    });

    const dataByRoleAndQuestion = groupDataByRoleAndQuestion(questionResults);

    let aggregatedDataByRole = aggregateDataByRole(questionResults);
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
    questionResults: QuestionResultWithRelations[],
) => {
    const aggregatedDataByRole: AggregatedDataByRole = {};

    for (const entry of questionResults) {
        const roles = entry.question.roles;
        if (!roles || roles.length === 0) {
            continue;
        }

        for (const role of roles) {
            const roleName = getRoleName(role);

            // Create the role if it doesn't exist
            aggregatedDataByRole[roleName] =
                aggregatedDataByRole[roleName] ?? {};

            const userId = entry.userId;

            const answerValue = parseInt(
                entry.answer.option.toString() ?? "0",
                10,
            );

            const { name, communicationPreferences } = entry.user;
            let communicationMethods: string[] =
                communicationPreferences?.methods ?? [];
            if (
                !communicationPreferences ||
                communicationPreferences.methods.length === 0
            ) {
                communicationMethods = ["Do not contact"];
            }

            if (!aggregatedDataByRole[roleName]![userId]) {
                aggregatedDataByRole[roleName]![userId] = {
                    name: name ?? "Unknown User",
                    communicationPreferences: communicationMethods,
                    counts: [0, 0, 0, 0],
                };
            }
            aggregatedDataByRole[roleName]![userId]!.counts[answerValue]++;
        }
    }

    return aggregatedDataByRole;
};

const groupDataByRoleAndQuestion = (
    questionResults: QuestionResultWithRelations[],
) => {
    const dataByRoleAndQuestion: DataByRoleAndQuestion = {};

    for (const entry of questionResults) {
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
            pushUserData(dataByRoleAndQuestion, roleName, questionText, entry);
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
    entry: QuestionResultWithRelations,
): void => {
    let communicationMethod: string[] =
        entry.user.communicationPreferences?.methods ?? [];
    if (
        !entry.user.communicationPreferences ||
        entry.user.communicationPreferences.methods.length === 0
    ) {
        communicationMethod = ["Do not contact"];
    }
    dataByRoleAndQuestion[roleName]![questionText]!.push({
        name: entry.user.name ?? "Unknown User",
        communicationPreferences: communicationMethod,
        answer: entry.answer.option.toString() ?? "Unknown Answer",
        roles: entry.user.roles.map((role) => role.role) ?? [],
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

export interface FetchUserAnswersParams {
    role?: string;
    questionText?: string;
    unit?: string;
}

const buildWhereClause = ({
    role,
    questionText,
    unit,
}: FetchUserAnswersParams) => {
    const questionWhere: Prisma.QuestionWhereInput = {};

    // Only select the role that is selected. This ensures we don't have to filter out the roles later
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

    const userWhere: Prisma.UserWhereInput = {};

    if (unit) {
        userWhere.businessUnit = {
            unit: {
                equals: unit,
                mode: "insensitive",
            },
        };
    }

    const where: Prisma.QuestionResultWhereInput = {};
    if (Object.keys(questionWhere).length > 0) {
        where.question = questionWhere;
    }
    if (Object.keys(userWhere).length > 0) {
        where.user = userWhere;
    }
    return where;
};
