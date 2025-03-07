import { expect, type Page } from "@playwright/test";
import { SurveyPage } from "./survey-page";
import { type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { encode, type DefaultJWT } from "next-auth/jwt";
import type { DbHelper } from "./db-helper";

type RoleIdMap = Record<string, string>;
export const SURVEY_NAME = Object.freeze("Survey");
export const ANSWER_OPTIONS_COUNT = Object.freeze(4);
export const COMMUNICATION_PREFERENCES = Object.freeze([
    "Email",
    "Slack",
    "Phone",
]);
export const USER_NAME = Object.freeze("Test User");
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

export class TestSetup {
    private readonly cwd = new URL("..", import.meta.url);
    private container: StartedPostgreSqlContainer | null;

    constructor(container: StartedPostgreSqlContainer) {
        this.container = container;
    }

    async setupSurveyPage(page: Page): Promise<SurveyPage> {
        return new SurveyPage(page);
    }

    async setupSessionCookie(page: Page, tokenValue: string): Promise<void> {
        const sessionCookie = {
            name: "authjs.session-token",
            value: tokenValue,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            secure: false,
            sameSite: "Lax" as const,
        };

        await page.context().addCookies([sessionCookie]);
        const cookies = await page.context().cookies();
        const sessionCookieSet = cookies.some(
            (cookie) =>
                cookie.name === "authjs.session-token" &&
                cookie.value === tokenValue,
        );

        if (!sessionCookieSet) {
            throw new Error("Failed to set session cookie");
        }
    }

    async createRoleAndReturnIdMap(
        role: string,
        dbHelper: DbHelper,
    ): Promise<RoleIdMap> {
        const id = await dbHelper.createRole(role);
        return { [role]: id };
    }

    async createMultipleRoleSurvey(dbHelper: DbHelper) {
        try {
            await Promise.all(
                Array.from({ length: ANSWER_OPTIONS_COUNT }, (_, i) =>
                    dbHelper.createAnswerOption(i),
                ),
            );
            const surveyId = await dbHelper.createSurvey(SURVEY_NAME);
            // Create all roles concurrently
            const rolesPromises = MULTIPLE_ROLES.map((role) =>
                this.createRoleAndReturnIdMap(role, dbHelper),
            );
            const rolesArray: RoleIdMap[] = await Promise.all(rolesPromises);
            // Combine all role ID maps into one
            const roleIds: RoleIdMap = rolesArray.reduce(
                (acc: RoleIdMap, curr: RoleIdMap) => ({ ...acc, ...curr }),
                {},
            );

            for (const question of QUESTIONS_WITH_MULTIPLE_ROLES) {
                const newQuestion = await dbHelper.createQuestion(
                    surveyId,
                    question.roles.map((role) => roleIds[role]!),
                    question.question,
                );
                expect(newQuestion).toBeTruthy();
            }

            return { surveyId, roleIds };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async setupUserAndSession(page: Page, dbHelper: DbHelper): Promise<void> {
        const userId = await dbHelper.createUser("Test User", "a@a.com");

        const payload: DefaultJWT = {
            name: "Test User",
            email: "a@a.com",
            picture: null,
            sub: userId,
        };

        const token = async () => {
            return encode({
                token: payload,
                salt: "authjs.session-token",
                secret: process.env.AUTH_SECRET ?? "dummy",
            });
        };

        const tokenValue = await token();

        if (tokenValue) {
            await this.setupSessionCookie(page, tokenValue);
        } else {
            throw new Error("Failed to create token");
        }
    }

    async createSingleRoleSurvey(dbHelper: DbHelper) {
        try {
            await Promise.all(
                Array.from({ length: ANSWER_OPTIONS_COUNT }, (_, i) =>
                    dbHelper.createAnswerOption(i),
                ),
            );

            const surveyId = await dbHelper.createSurvey(SURVEY_NAME);
            const roleId = await dbHelper.createRole(SINGLE_ROLE[0]!);

            await Promise.all(
                QUESTIONS_WITH_SINGLE_ROLE.map((question) =>
                    dbHelper.createQuestion(
                        surveyId,
                        [roleId],
                        question.question,
                    ),
                ),
            );

            return { surveyId, roleId };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
