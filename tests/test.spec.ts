import { expect, test } from "@playwright/test";
import { type SurveyPage } from "~/tests/survey-page";
import { DbHelper } from "~/tests/db-helper";
import { type ChildProcess } from "child_process";

import { slugify } from "~/utils/slugify";
import {
    ANSWER_OPTIONS_COUNT,
    COMMUNICATION_PREFERENCES,
    MULTIPLE_ROLES,
    QUESTIONS_WITH_MULTIPLE_ROLES,
    QUESTIONS_WITH_SINGLE_ROLE,
    SINGLE_ROLE,
    TestSetup,
    USER_NAME,
} from "~/tests/test-setup";
import treeKill from "tree-kill";

import { promisify } from "node:util";

const treeKillAsPromised = promisify(treeKill);
const killAllProcesses = async (process: ChildProcess) => {
    if (process?.pid) {
        await treeKillAsPromised(process.pid);
    }
};
test.describe("Desktop tests using a single role", () => {
    let nextProcess: ChildProcess;
    let surveyPage: SurveyPage;
    let dbHelper: DbHelper;
    let testSetup: TestSetup;

    // Set up the landing page before each test
    test.beforeEach(async ({ page }, testInfo) => {
        try {
            testInfo.setTimeout(100000);
            dbHelper = await DbHelper.create();
            testSetup = new TestSetup(dbHelper.getContainer());
            const { port, process } = await testSetup.setupNextProcess();
            nextProcess = process;
            surveyPage = await testSetup.setupSurveyPage(page, port);
            await testSetup.setupUserAndSession(page, dbHelper);

            // Fill the database with what we need for the tests with a single role.
            await testSetup.createSingleRoleSurvey(dbHelper);

            // Navigate to the landing page and check to see if we are logged in correctly
            const headingElement = await surveyPage.navigateToLandingPage();
            await expect(headingElement).toBeVisible();
        } catch (error) {
            throw error;
        }
    });

    test.afterEach(async ({ page }) => {
        try {
            const cookies = await page.context().cookies();
            const sessionCookie = cookies.find(
                (cookie) => cookie.name === "next-auth.session-token",
            );

            if (sessionCookie) {
                await page.context().clearCookies();
            }

            await killAllProcesses(nextProcess);
        } finally {
            await dbHelper.getContainer().stop();
            await page.close();
        }
    });

    test("Check if the default role(s) are set", async () => {
        await surveyPage.navigateToSurveyPage();
        const roleElements =
            await surveyPage.checkProgressionBarForRoles(SINGLE_ROLE);
        await Promise.all(
            roleElements.map((roleElement) =>
                expect(roleElement).toBeVisible(),
            ),
        );
    });

    test("Answer questions of a single role", async () => {
        await surveyPage.navigateToSurveyPage();

        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );
        for (const [index, question] of questionsText.entries()) {
            await surveyPage.selectAnswerOption(
                question,
                index % ANSWER_OPTIONS_COUNT,
            );
        }

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);
    });

    test("Forget to fill in a question", async () => {
        await surveyPage.navigateToSurveyPage();

        // Answer the questions, but forget the first
        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );

        for (const [index, question] of questionsText.slice(1).entries()) {
            await surveyPage.selectAnswerOption(
                question,
                (index + 1) % ANSWER_OPTIONS_COUNT,
            );
        }

        await surveyPage.submitAnswers();
        const validationErrorElement =
            await surveyPage.checkForValidationError("yourRole");
        await expect(validationErrorElement).toBeVisible();

        // fill in the first question
        await surveyPage.selectAnswerOption(questionsText[0]!, 0);

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);
    });

    test("Fill in the survey and show you are present on the anonymous results", async () => {
        await surveyPage.page.waitForLoadState("networkidle");
        await surveyPage.navigateToSurveyPage();

        // Answer the questions
        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );
        for (const [index, question] of questionsText.entries()) {
            await surveyPage.selectAnswerOption(
                question,
                index % ANSWER_OPTIONS_COUNT,
            );
        }

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);

        // Check if the user is present in the anonymous results
        const isTextVisible = await surveyPage.navigateToAnonymousResults(
            slugify(SINGLE_ROLE[0]!),
        );
        expect(isTextVisible).toBe(true);
        const is404Hidden = await surveyPage.checkAnonymousResultsIsNotEmpty();
        expect(is404Hidden).toBe(true);
    });

    test("Fill in the survey and show you are present on the find-the-expert page", async () => {
        await surveyPage.navigateToSurveyPage();

        // Answer the questions
        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );
        for (const [index, question] of questionsText.entries()) {
            await surveyPage.selectAnswerOption(
                question,
                index % ANSWER_OPTIONS_COUNT,
            );
        }

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);

        // Check if the user is present in the find-the-expert page, with the "do not contact" option
        const isTextVisible = await surveyPage.navigateToFindTheExpert(
            slugify(SINGLE_ROLE[0]!),
        );
        expect(isTextVisible).toBe(true);

        const {
            isUserVisible: userShouldNotBeVisible,
            isDoNotContactVisible: doNotContactShouldBeVisible,
        } = await surveyPage.checkUserIsPresentInFindTheExpertPage(
            USER_NAME,
            false,
        );
        expect(userShouldNotBeVisible).toBe(true);
        expect(doNotContactShouldBeVisible).toBe(true);

        // Change the communication preferences
        const headingElement = await surveyPage.navigateToLandingPage();
        await expect(headingElement).toBeVisible();
        await surveyPage.selectCommunicationPreferences(
            COMMUNICATION_PREFERENCES,
        );

        // Check if the user is present in the find-the-expert page, with the communication preferences
        const isTextVisibleAgain = await surveyPage.navigateToFindTheExpert(
            slugify(SINGLE_ROLE[0]!),
        );
        expect(isTextVisibleAgain).toBe(true);

        const {
            isUserVisible: userShouldBeVisible,
            isDoNotContactVisible: doNotContactShouldNotBeVisible,
        } = await surveyPage.checkUserIsPresentInFindTheExpertPage(
            USER_NAME,
            true,
        );
        expect(userShouldBeVisible).toBe(true);
        expect(doNotContactShouldNotBeVisible).toBe(true);
    });
});

test.describe("Desktop tests using a multiple roles", () => {
    let nextProcess: ChildProcess;
    let surveyPage: SurveyPage;
    let dbHelper: DbHelper;
    let testSetup: TestSetup;

    // Set up the landing page before each test
    test.beforeEach(async ({ page }, testInfo) => {
        try {
            testInfo.setTimeout(100000);
            dbHelper = await DbHelper.create();
            testSetup = new TestSetup(dbHelper.getContainer());
            const { port, process } = await testSetup.setupNextProcess();
            nextProcess = process;
            surveyPage = await testSetup.setupSurveyPage(page, port);
            await testSetup.setupUserAndSession(page, dbHelper);

            await testSetup.createMultipleRoleSurvey(dbHelper);
            const headingElement = await surveyPage.navigateToLandingPage();
            await expect(headingElement).toBeVisible();
        } catch (error) {
            throw error;
        }
    });

    // Clean up the landing page after each test
    test.afterEach(async ({ page }) => {
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(
            (cookie) => cookie.name === "next-auth.session-token",
        );
        if (sessionCookie) {
            await page.context().clearCookies();
        }
        await page.close();
        await killAllProcesses(nextProcess);
        await dbHelper.getContainer().stop();
    });

    test("Create multiple questions and assign specific roles", async () => {
        await surveyPage.selectRoles(MULTIPLE_ROLES);
        await surveyPage.navigateToSurveyPage();

        const roleElements =
            await surveyPage.checkProgressionBarForRoles(MULTIPLE_ROLES);
        await Promise.all(
            roleElements.map((roleElement) =>
                expect(roleElement).toBeVisible(),
            ),
        );
    });

    test("if questions are visible in roles", async () => {
        await surveyPage.selectRoles(MULTIPLE_ROLES);
        await surveyPage.navigateToSurveyPage();
        const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
            (question) => question.question,
        );
        const questionElements =
            await surveyPage.checkRoleForQuestion(questionsText);

        await Promise.all(
            questionElements.map((questionElement) =>
                expect(questionElement).toBeVisible(),
            ),
        );
    });

    test("Answer questions of multiple roles", async () => {
        await surveyPage.selectRoles(["Role 1"]);
        await surveyPage.navigateToSurveyPage();

        const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
            (question) => question.question,
        );

        for (const role of MULTIPLE_ROLES) {
            for (const [index, questionText] of questionsText.entries()) {
                const questionRoles =
                    QUESTIONS_WITH_MULTIPLE_ROLES[index]?.roles;

                if (!questionRoles?.includes(role)) {
                    continue;
                }

                await surveyPage.selectAnswerOption(
                    questionText,
                    index % ANSWER_OPTIONS_COUNT,
                );
            }

            if (role === MULTIPLE_ROLES[MULTIPLE_ROLES.length - 1]) {
                await surveyPage.submitAnswers();
                await surveyPage.page.waitForURL(
                    `http://localhost:${surveyPage.port}/thank-you`,
                );
            } else {
                await surveyPage.goToNextQuestionsForDifferentRole();
            }
        }

        await surveyPage.checkUrl("thank-you");
    });
});

test.describe("Mobile tests using a single role", () => {
    let nextProcess: ChildProcess;
    let surveyPage: SurveyPage;
    let dbHelper: DbHelper;
    let testSetup: TestSetup;

    // Set up the landing page before each test
    test.beforeEach(async ({ page }, testInfo) => {
        try {
            testInfo.setTimeout(100000);
            dbHelper = await DbHelper.create();
            testSetup = new TestSetup(dbHelper.getContainer());
            const { port, process } = await testSetup.setupNextProcess();
            nextProcess = process;
            surveyPage = await testSetup.setupSurveyPage(page, port);
            await testSetup.setupUserAndSession(page, dbHelper);

            // Fill the database with what we need for the tests with a single role.
            await testSetup.createSingleRoleSurvey(dbHelper);

            // Navigate to the landing page and check to see if we are logged in correctly
            const headingElement = await surveyPage.navigateToLandingPage();
            await expect(headingElement).toBeVisible();
        } catch (error) {
            throw error;
        }
    });

    test.afterEach(async ({ page }) => {
        try {
            const cookies = await page.context().cookies();
            const sessionCookie = cookies.find(
                (cookie) => cookie.name === "next-auth.session-token",
            );

            if (sessionCookie) {
                await page.context().clearCookies();
            }

            await killAllProcesses(nextProcess);
        } finally {
            await dbHelper.getContainer().stop();
            await page.close();
        }
    });

    test("(Mobile) Check if the default role(s) are set", async () => {
        await surveyPage.navigateToSurveyPage();
        const roleElements =
            await surveyPage.mobileCheckProgressionBarForRoles(SINGLE_ROLE);
        await Promise.all(
            roleElements.map((roleElement) =>
                expect(roleElement).toBeVisible(),
            ),
        );
    });

    test("(Mobile) Answer questions of a single role", async () => {
        await surveyPage.navigateToSurveyPage();

        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );
        for (const question of questionsText) {
            await surveyPage.mobileSelectAnswerOption(question);
        }

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        await surveyPage.checkUrl("thank-you");
    });

    test("(Mobile) Forget to fill in a question", async () => {
        await surveyPage.navigateToSurveyPage();

        // Answer the questions, but forget the first
        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );

        for (const question of questionsText.slice(1)) {
            await surveyPage.mobileSelectAnswerOption(question);
        }

        await surveyPage.submitAnswers();
        const validationErrorElement =
            await surveyPage.checkForValidationError("yourRole");
        await expect(validationErrorElement).toBeVisible();

        // fill in the first question
        await surveyPage.mobileSelectAnswerOption(questionsText[0]!);

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);
    });

    test("(Mobile) Fill in the survey and show you are present on the find-the-expert page", async () => {
        await surveyPage.page.waitForLoadState("networkidle");
        await surveyPage.navigateToSurveyPage();

        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );
        for (const question of questionsText) {
            await surveyPage.mobileSelectAnswerOption(question);
        }

        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);

        // Check if the user is present in the find-the-expert page, with the "do not contact" option
        const isTextVisible = await surveyPage.navigateToFindTheExpert(
            slugify(SINGLE_ROLE[0]!),
        );
        expect(isTextVisible).toBe(true);

        const {
            isUserVisible: userShouldNotBeVisible,
            isDoNotContactVisible: doNotContactShouldBeVisible,
        } = await surveyPage.checkUserIsPresentInFindTheExpertPage(
            USER_NAME,
            false,
        );
        expect(userShouldNotBeVisible).toBe(true);
        expect(doNotContactShouldBeVisible).toBe(true);

        // Change the communication preferences
        const headingElement = await surveyPage.navigateToLandingPage();
        await expect(headingElement).toBeVisible();
        await surveyPage.selectCommunicationPreferences(
            COMMUNICATION_PREFERENCES,
        );

        // Check if the user is present in the find-the-expert page, with the communication preferences
        const isTextVisibleAgain = await surveyPage.navigateToFindTheExpert(
            slugify(SINGLE_ROLE[0]!),
        );
        expect(isTextVisibleAgain).toBe(true);

        const {
            isUserVisible: userShouldBeVisible,
            isDoNotContactVisible: doNotContactShouldNotBeVisible,
        } = await surveyPage.checkUserIsPresentInFindTheExpertPage(
            USER_NAME,
            true,
        );
        expect(userShouldBeVisible).toBe(true);
        expect(doNotContactShouldNotBeVisible).toBe(true);
    });

    test("(Mobile) Fill in the survey and show you are present on the anonymous results", async () => {
        await surveyPage.navigateToSurveyPage();

        const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
            (question) => question.question,
        );
        for (const question of questionsText) {
            await surveyPage.mobileSelectAnswerOption(question);
        }
        await surveyPage.submitAnswers();
        await surveyPage.page.waitForURL(
            `http://localhost:${surveyPage.port}/thank-you`,
        );
        const isUrlCorrect = await surveyPage.checkUrl("thank-you");
        expect(isUrlCorrect).toBe(true);

        // Check if the user is present in the anonymous results
        const isTextVisible = await surveyPage.navigateToAnonymousResults(
            slugify(SINGLE_ROLE[0]!),
        );
        expect(isTextVisible).toBe(true);
        const is404Hidden = await surveyPage.checkAnonymousResultsIsNotEmpty();
        expect(is404Hidden).toBe(true);
    });
});

test.describe("Mobile tests using multiple roles", () => {
    let nextProcess: ChildProcess;
    let surveyPage: SurveyPage;
    let dbHelper: DbHelper;
    let testSetup: TestSetup;

    // Set up the landing page before each test
    test.beforeEach(async ({ page }, testInfo) => {
        try {
            testInfo.setTimeout(100000);
            dbHelper = await DbHelper.create();
            testSetup = new TestSetup(dbHelper.getContainer());
            const { port, process } = await testSetup.setupNextProcess();
            nextProcess = process;
            surveyPage = await testSetup.setupSurveyPage(page, port);
            await testSetup.setupUserAndSession(page, dbHelper);

            // Fill the database with what we need for the tests with a single role.
            await testSetup.createMultipleRoleSurvey(dbHelper);

            // Navigate to the landing page and check to see if we are logged in correctly
            const headingElement = await surveyPage.navigateToLandingPage();
            await expect(headingElement).toBeVisible();
        } catch (error) {
            throw error;
        }
    });

    test.afterEach(async ({ page }) => {
        try {
            const cookies = await page.context().cookies();
            const sessionCookie = cookies.find(
                (cookie) => cookie.name === "next-auth.session-token",
            );

            if (sessionCookie) {
                await page.context().clearCookies();
            }

            await killAllProcesses(nextProcess);
        } finally {
            await dbHelper.getContainer().stop();
            await page.close();
        }
    });

    test("(Mobile) Create multiple questions and assign specific roles", async () => {
        await surveyPage.selectRoles(MULTIPLE_ROLES);
        await surveyPage.navigateToSurveyPage();

        const roleElements =
            await surveyPage.mobileCheckProgressionBarForRoles(MULTIPLE_ROLES);
        await Promise.all(
            roleElements.map((roleElement) =>
                expect(roleElement).toBeVisible(),
            ),
        );
    });

    test("(Mobile) if questions are visible in roles", async () => {
        await surveyPage.navigateToSurveyPage();
        const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
            (question) => question.question,
        );
        await surveyPage.checkRoleForQuestion(questionsText);
    });

    test("(Mobile) Answer questions of multiple roles", async () => {
        await surveyPage.selectRoles(["Role 1"]);
        await surveyPage.navigateToSurveyPage();

        const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
            (question) => question.question,
        );
        for (const role of MULTIPLE_ROLES) {
            for (const [index, questionText] of questionsText.entries()) {
                const questionRoles =
                    QUESTIONS_WITH_MULTIPLE_ROLES[index]?.roles;

                if (!questionRoles?.includes(role)) {
                    continue;
                }
                await surveyPage.mobileSelectAnswerOption(questionText);
            }

            if (role === MULTIPLE_ROLES[MULTIPLE_ROLES.length - 1]) {
                await surveyPage.submitAnswers();
            } else {
                await surveyPage.goToNextQuestionsForDifferentRole();
            }
        }

        await surveyPage.checkUrl("thank-you");
    });
});
