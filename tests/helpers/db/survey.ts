import type { PrismaDbClient } from "~/prisma";

export type RoleIdMap = Record<string, string>;
export const SURVEY_NAME = Object.freeze("Survey");
export const ANSWER_OPTIONS_COUNT = Object.freeze(4);
export const COMMUNICATION_PREFERENCES = Object.freeze([
    "Email",
    "Slack",
    "Phone",
]);
export const SINGLE_ROLE = Object.freeze(["General"]);
export const MULTIPLE_ROLES = Object.freeze(["General", "Role 1"]);
export const QUESTIONS_WITH_SINGLE_ROLE = Object.freeze([
    { question: "Kubernetes", roles: SINGLE_ROLE },
    { question: "Docker", roles: SINGLE_ROLE },
    { question: "C#", roles: SINGLE_ROLE },
]);

export const QUESTIONS_WITH_MULTIPLE_ROLES = Object.freeze([
    { question: "Kubernetes", roles: SINGLE_ROLE },
    { question: "Docker", roles: MULTIPLE_ROLES },
    { question: "C#", roles: MULTIPLE_ROLES },
]);

export class SurveyDbHelper {
    #db: PrismaDbClient;

    constructor(db: PrismaDbClient) {
        this.#db = db;
    }

    async createSurvey(surveyName: string): Promise<string> {
        const surveyExists = await this.#db.survey.findUnique({
            where: {
                surveyName: surveyName,
            },
        });

        if (surveyExists) {
            return surveyExists.id;
        }

        const survey = await this.#db.survey.create({
            data: {
                surveyName: surveyName,
                surveyDate: new Date(2025, 0, 1),
            },
        });
        return survey.id;
    }

    async createQuestion(
        surveyId: string,
        roleIds: string[],
        questionText: string,
    ): Promise<string> {
        // check if question already exists
        const questionExists = await this.#db.question.findFirst({
            where: {
                questionText: questionText,
            },
        });

        if (questionExists) {
            return questionExists.id;
        }

        const question = await this.#db.question.create({
            data: {
                questionText: questionText,
                surveyId: surveyId,
                roles: { connect: roleIds.map((id) => ({ id })) },
            },
        });
        return question.id;
    }

    async createAnswerOption(option: number) {
        // check if answer option already exists
        const answerOptionExists = await this.#db.answerOption.findFirst({
            where: {
                option: option,
            },
        });

        if (answerOptionExists) {
            return answerOptionExists.id;
        }

        return (
            await this.#db.answerOption.create({
                data: {
                    option: option,
                },
            })
        ).id;
    }

    async createRole(roleName: string) {
        // retrieve all existing roles
        const roles = await this.#db.role.findMany();
        const roleExists = roles.find((role) => role.role === roleName);

        if (roleExists) {
            return roleExists.id;
        }

        const role = await this.#db.role.create({
            data: {
                role: roleName,
                default: roleName === "General",
            },
        });
        return role.id;
    }

    async #createRoleAndReturnIdMap(role: string): Promise<RoleIdMap> {
        const id = await this.createRole(role);
        return { [role]: id };
    }

    async createSingleRoleSurvey() {
        await Promise.all(
            Array.from({ length: ANSWER_OPTIONS_COUNT }, (_, i) =>
                this.createAnswerOption(i),
            ),
        );

        const surveyId = await this.createSurvey(SURVEY_NAME);
        const roleId = await this.createRole(SINGLE_ROLE[0]!);

        await Promise.all(
            QUESTIONS_WITH_SINGLE_ROLE.map((question) =>
                this.createQuestion(surveyId, [roleId], question.question),
            ),
        );

        return { surveyId, roleId };
    }

    async createMultipleRoleSurvey() {
        await Promise.all(
            Array.from({ length: ANSWER_OPTIONS_COUNT }, (_, i) =>
                this.createAnswerOption(i),
            ),
        );
        const surveyId = await this.createSurvey(SURVEY_NAME);
        // Create all roles concurrently
        const rolesPromises = MULTIPLE_ROLES.map((role) =>
            this.#createRoleAndReturnIdMap(role),
        );
        const rolesArray: RoleIdMap[] = await Promise.all(rolesPromises);
        // Combine all role ID maps into one
        const roleIds: RoleIdMap = rolesArray.reduce(
            (acc: RoleIdMap, curr: RoleIdMap) => ({ ...acc, ...curr }),
            {},
        );

        for (const question of QUESTIONS_WITH_MULTIPLE_ROLES) {
            await this.createQuestion(
                surveyId,
                question.roles.map((role) => roleIds[role]!),
                question.question,
            );
        }

        return { surveyId, roleIds };
    }
}
