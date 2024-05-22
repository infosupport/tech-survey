import { expect, test, type Page } from "@playwright/test";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { LandingPage } from "./survey-page";
import { DbHelper } from "./db-helper";
import { promisify } from "util";
import { type ChildProcess, exec, spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import jwt from "next-auth/jwt";
import { slugify } from "~/utils/slugify";

const execAsync = promisify(exec);
const cwd = new URL("..", import.meta.url);

export interface DefaultJWT extends Record<string, unknown> {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
}

test.describe("using test containers", () => {
  let container: StartedPostgreSqlContainer;
  let client: PrismaClient;
  let nextProcess: ChildProcess;
  let landingPage: LandingPage;
  let dbHelper: DbHelper;
  let page: Page;

  // constants used in multiple tests
  const SURVEY_NAME = "Survey";
  const SINGLE_ROLE = ["General"];
  const COMMUNICATION_PREFERENCES = ["Email", "Slack", "Phone"];
  const USER_NAME = "Test User";
  const QUESTIONS_WITH_SINGLE_ROLE = [
    { question: "Kubernetes", roles: SINGLE_ROLE },
    { question: "Docker", roles: SINGLE_ROLE },
    { question: "C#", roles: SINGLE_ROLE },
  ];
  const MULTIPLE_ROLES = ["General", "Role 1"];
  const QUESTIONS_WITH_MULTIPLE_ROLES = [
    { question: "Kubernetes", roles: SINGLE_ROLE },
    { question: "Docker", roles: MULTIPLE_ROLES },
    { question: "C#", roles: MULTIPLE_ROLES },
  ];
  const ANSWER_OPTIONS_COUNT = 4;

  async function createSingleRoleSurvey() {
    for (let i = 0; i < ANSWER_OPTIONS_COUNT; i++) {
      await dbHelper.createAnswerOption(i);
    }

    const surveyId = await dbHelper.createSurvey(SURVEY_NAME);
    expect(surveyId).toBeTruthy();
    const roleId = await dbHelper.createRole(SINGLE_ROLE[0] || "");
    expect(roleId).toBeTruthy();

    // Create questions
    for (let question of QUESTIONS_WITH_SINGLE_ROLE) {
      const newQuestions = await dbHelper.createQuestion(
        surveyId,
        [roleId],
        question.question,
      );
      expect(newQuestions).toBeTruthy();
    }
  }

  async function createMultipleRoleSurvey() {
    const surveyId = await dbHelper.createSurvey(SURVEY_NAME);
    expect(surveyId).toBeTruthy();

    for (let i = 0; i < ANSWER_OPTIONS_COUNT; i++) {
      await dbHelper.createAnswerOption(i);
    }

    // Create roles and store their IDs
    const roleIds: { [key: string]: string } = {};
    for (let role of MULTIPLE_ROLES) {
      roleIds[role] = await dbHelper.createRole(role);
      expect(roleIds[role]).toBeTruthy();
    }

    for (let question of QUESTIONS_WITH_MULTIPLE_ROLES) {
      const newQuestion = await dbHelper.createQuestion(
        surveyId,
        question.roles.map((role) => roleIds[role] || ""),
        question.question,
      );
      expect(newQuestion).toBeTruthy();
    }
  }

  // Set up the test container and database before all tests
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60000);

    try {
      container = await new PostgreSqlContainer().start();
      await execAsync("npm run db:push", {
        env: {
          ...process.env,
          DATABASE_URL: container.getConnectionUri(),
        },
        cwd,
      });
      client = new PrismaClient({
        datasources: {
          db: {
            url: container.getConnectionUri(),
          },
        },
        log: [
          {
            emit: "event",
            level: "query",
          },
        ],
      });

      // Launch browser in parallel
      const portPromise = new Promise<number>((res, rej) => {
        nextProcess = spawn("npm", ["run", "dev", "--", "--port", "0"], {
          cwd,
          stdio: "pipe",
          env: {
            ...process.env,
            DATABASE_URL: container.getConnectionUri(),
          },
        });
        nextProcess.stdout!.on("data", (chunk: Buffer) => {
          const str = chunk.toString();
          process.stdout.write(str);
          const portMatch = /local:\s*http:\/\/.+:(\d+)/gim.exec(str);
          if (portMatch) {
            res(parseInt(portMatch[1]!));
          }
        });
        nextProcess.stderr!.on("data", (chunk: Buffer) => {
          process.stderr.write(chunk);
        });
        nextProcess.on("error", (err) => rej(err));
      });

      // Set a timeout for the browser launch
      const port = await Promise.race([
        portPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Browser launch timeout")), 30000),
        ),
      ]);

      page = await browser.newPage();

      landingPage = new LandingPage(page, port as number);
      dbHelper = new DbHelper(client);
    } catch (error) {
      console.error("Error during beforeAll:", error);
      throw error; // Rethrow the error to fail the test suite
    }
  });

  // Clean up the test container and database after all tests
  test.afterAll(async () => {
    if (nextProcess) {
      nextProcess.kill();
    }
    await container.stop();
  });

  // Set up the landing page before each test
  test.beforeEach(async ({ browser }) => {
    const userId = await dbHelper.createUser("Test User", "a@a.com");

    // Only continue if the user was created
    if (!userId) {
      throw new Error("User was not created");
    }

    const payload: DefaultJWT = {
      name: "Test User",
      email: "a@a.com",
      picture: null,
      sub: userId,
    };

    const token = async () => {
      return jwt.encode({
        token: payload,
        secret: "testB",
      });
    };

    const tokenValue = await token();

    if (tokenValue) {
      const sessionCookie = {
        name: "next-auth.session-token",
        value: tokenValue,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax" as const,
      };

      await page.context().addCookies([sessionCookie]);

      // Check if the cookie has been set correctly
      const cookies = await page.context().cookies();
      const sessionCookieSet = cookies.some(
        (cookie) =>
          cookie.name === "next-auth.session-token" &&
          cookie.value === tokenValue,
      );

      if (!sessionCookieSet) {
        throw new Error("Failed to set session cookie");
      }
      page = await browser.newPage({ ignoreHTTPSErrors: true });
    } else {
      throw new Error("Failed to create token");
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
  });

  test("Visit the home-page as a logged in user.", async () => {
    await createSingleRoleSurvey();
    await landingPage.navigateToLandingPage();
  });

  test("Check if the default role(s) are set", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();
    await landingPage.checkProgressionBarForRoles(SINGLE_ROLE);
  });

  test("Create multiple questions and assign specific roles", async () => {
    await createMultipleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.selectRoles(MULTIPLE_ROLES);
    await landingPage.navigateToSurveyPage();
    await landingPage.checkProgressionBarForRoles(MULTIPLE_ROLES);
  });

  test("if questions are visible in roles", async () => {
    await createMultipleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();
    const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
      (question) => question.question,
    );
    await landingPage.checkRoleForQuestion(questionsText);
  });

  test("Answer questions of a single role", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");
  });

  test("Answer questions of multiple roles", async () => {
    await createMultipleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.selectRoles(["Role 1"]);
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
      (question) => question.question,
    );

    // Outer loop over the roles
    for (let j = 0; j < MULTIPLE_ROLES.length; j++) {
      // Inner loop over the questions
      for (let i = 0; i < questionsText.length; i++) {
        // Get the roles for the current question
        const questionRoles = QUESTIONS_WITH_MULTIPLE_ROLES[i]?.roles;

        // Check if the current role matches the roles of the current question
        if (questionRoles?.includes(MULTIPLE_ROLES[j] || "")) {
          await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
        }
      }

      // Check if it's the last role
      if (j === MULTIPLE_ROLES.length - 1) {
        await landingPage.submitAnswers();
      } else {
        await landingPage.goToNextQuestionsForDifferentRole();
      }
    }

    await landingPage.checkUrl("thank-you");
  });

  test("Forget to fill in a question", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions, but forget the first
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 1; i < questionsText.length; i++) {
      await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkForValidationError(slugify("General"));

    // fill in the first question
    await landingPage.selectAnswerOption(questionsText[0] || "", 0);

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");
  });

  test("Fill in the survey and show you are present on the anonymous results", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");

    // Check if the user is present in the anonymous results
    await landingPage.navigateToAnonymousResults(slugify(SINGLE_ROLE[0] || ""));
    await landingPage.checkAnonymousResultsIsNotEmpty();
  });

  test("Fill in the survey and show you are present on the find-the-expert page", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");

    // Check if the user is present in the find-the-expert page, with the "do not contact" option
    await landingPage.navigateToFindTheExpert(slugify(SINGLE_ROLE[0] || ""));
    await landingPage.checkUserIsPresentInFindTheExpertPage(USER_NAME, false);

    // Change the communication preferences
    await landingPage.navigateToLandingPage();
    await landingPage.selectCommunicationPreferences(COMMUNICATION_PREFERENCES);

    // Check if the user is present in the find-the-expert page, with the communication preferences
    await landingPage.navigateToFindTheExpert(slugify(SINGLE_ROLE[0] || ""));
    await landingPage.checkUserIsPresentInFindTheExpertPage(USER_NAME, true);
  });

  // --- Mobile tests ---
  test("(Mobile) visit the home-page as a logged in user.", async () => {
    await createSingleRoleSurvey();
    await landingPage.navigateToLandingPage();
  });

  test("(Mobile) Check if the default role(s) are set", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();
    await landingPage.mobileCheckProgressionBarForRoles(SINGLE_ROLE);
  });

  test("(Mobile) Create multiple questions and assign specific roles", async () => {
    await createMultipleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.selectRoles(MULTIPLE_ROLES);
    await landingPage.navigateToSurveyPage();
    await landingPage.mobileCheckProgressionBarForRoles(MULTIPLE_ROLES);
  });

  test("(Mobile) if questions are visible in roles", async () => {
    await createMultipleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();
    const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
      (question) => question.question,
    );
    await landingPage.checkRoleForQuestion(questionsText);
  });

  test("(Mobile) Answer questions of a single role", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.MobileSelectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");
  });

  test("(Mobile) Answer questions of multiple roles", async () => {
    await createMultipleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.selectRoles(["Role 1"]);
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_MULTIPLE_ROLES.map(
      (question) => question.question,
    );

    // Outer loop over the roles
    for (let j = 0; j < MULTIPLE_ROLES.length; j++) {
      // Inner loop over the questions
      for (let i = 0; i < questionsText.length; i++) {
        // Get the roles for the current question
        const questionRoles = QUESTIONS_WITH_MULTIPLE_ROLES[i]?.roles;

        // Check if the current role matches the roles of the current question
        if (questionRoles?.includes(MULTIPLE_ROLES[j] || "")) {
          await landingPage.MobileSelectAnswerOption(
            questionsText[i] || "",
            i % 4,
          );
        }
      }

      // Check if it's the last role
      if (j === MULTIPLE_ROLES.length - 1) {
        await landingPage.submitAnswers();
      } else {
        await landingPage.goToNextQuestionsForDifferentRole();
      }
    }

    await landingPage.checkUrl("thank-you");
  });

  test("(Mobile) Forget to fill in a question", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions, but forget the first
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 1; i < questionsText.length; i++) {
      await landingPage.MobileSelectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkForValidationError(slugify("General"));

    // fill in the first question
    await landingPage.MobileSelectAnswerOption(questionsText[0] || "", 0);

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");
  });

  test("(Mobile) Fill in the survey and show you are present on the anonymous results", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.MobileSelectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");

    // Check if the user is present in the anonymous results
    await landingPage.navigateToAnonymousResults(slugify(SINGLE_ROLE[0] || ""));
    await landingPage.checkAnonymousResultsIsNotEmpty();
  });

  test("(Mobile) Fill in the survey and show you are present on the find-the-expert page", async () => {
    await createSingleRoleSurvey();

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = QUESTIONS_WITH_SINGLE_ROLE.map(
      (question) => question.question,
    );
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.MobileSelectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");

    // Check if the user is present in the find-the-expert page, with the "do not contact" option
    await landingPage.navigateToFindTheExpert(slugify(SINGLE_ROLE[0] || ""));
    await landingPage.checkUserIsPresentInFindTheExpertPage(USER_NAME, false);

    // Change the communication preferences
    await landingPage.navigateToLandingPage();
    await landingPage.selectCommunicationPreferences(COMMUNICATION_PREFERENCES);

    // Check if the user is present in the find-the-expert page, with the communication preferences
    await landingPage.navigateToFindTheExpert(slugify(SINGLE_ROLE[0] || ""));
    await landingPage.checkUserIsPresentInFindTheExpertPage(USER_NAME, true);
  });
});
