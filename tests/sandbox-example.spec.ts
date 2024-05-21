import { expect, test, type Page } from "@playwright/test";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { LandingPage } from "./landing-page";
import { promisify } from "util";
import { type ChildProcess, exec, spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import jwt from "next-auth/jwt";

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
  let page: Page;

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

      landingPage = new LandingPage(page, port as number, client);
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
    const userId = await landingPage.createUser("Test User", "a@a.com");

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
      page = await browser.newPage();
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

  test("Ensure that surveys can be created", async () => {
    await landingPage.createSurvey("Survey");

    // Check if the survey is created
    const surveys = await landingPage.getSurveys();
    expect(surveys).toHaveLength(1);
    expect(surveys[0]?.surveyName).toBe("Survey");
  });

  test("Ensure that roles can be created", async () => {
    await landingPage.createRole("General");

    // Check if the roles are created
    const roles = await landingPage.getRoles();
    expect(roles).toHaveLength(1);
    expect(roles[0]?.role).toBe("General");
  });

  test("Ensure that questions can be created", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roleId = await landingPage.createRole("General");
    await landingPage.createQuestion(
      surveyId,
      [roleId],
      "What is your favorite color?",
    );

    // Check if the question is created
    const questions = await landingPage.getQuestions();
    expect(questions).toHaveLength(1);
    expect(questions[0]?.questionText).toBe("What is your favorite color?");
  });

  test("Ensure that a question can be assigned to multiple roles", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roleId1 = await landingPage.createRole("General");
    const roleId2 = await landingPage.createRole("Data");
    const questionId = await landingPage.createQuestion(
      surveyId,
      [roleId1, roleId2],
      "What is your favorite color?",
    );

    // check the roles assigned to the question
    const roles = await landingPage.getRolesAssignedToQuestion(questionId);
    expect(roles).toHaveLength(2);
    expect(roles.map((role) => role.role)).toContain("General");
    expect(roles.map((role) => role.role)).toContain("Data");
  });

  test("Ensure that answer options can be created", async () => {
    for (let i = 0; i < 4; i++) {
      await landingPage.createAnswerOption(i);
    }

    // Check if the question has the correct answer options
    const answerOptions = await landingPage.getAnswerOptions();
    expect(answerOptions).toHaveLength(4);
  });

  test("Ensure that a user can be created", async () => {
    await landingPage.createUser("John Doe", "jd@abc.com");
    const users = await landingPage.getUsers();
    expect(users).toHaveLength(1);
  });

  test("Ensure that the survey can be answered", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roleId = await landingPage.createRole("General");
    const questionId = await landingPage.createQuestion(
      surveyId,
      [roleId],
      "What is your favorite color?",
    );
    for (let i = 0; i < 4; i++) {
      await landingPage.createAnswerOption(i);
    }
    const answerOptions = await landingPage.getAnswerOptions();
    const userId = await landingPage.createUser("John Doe", "jd@abc.com");

    // Answer the question
    await landingPage.createQuestionResult(
      userId,
      questionId,
      answerOptions[0]!.id,
    );

    // Check if the answer is created
    const answers = await landingPage.getQuestionResult();
    expect(answers).toHaveLength(1);
    expect(answers[0]?.userId).toBe(userId);
    expect(answers[0]?.questionId).toBe(questionId);
    expect(answers[0]?.answerId).toBe(answerOptions[0]!.id);
  });

  test("Visit the home-page as a logged in user.", async () => {
    await landingPage.navigateToLandingPage();
  });

  test("Check if the default role(s) are set", async () => {
    await landingPage.createSurvey("Survey");
    const roles = ["General"];

    // Create roles and store their IDs
    const roleIds: { [key: string]: string } = {};
    for (let role of roles) {
      roleIds[role] = await landingPage.createRole(role);
    }

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();
    await landingPage.checkProgressionBarForRoles(["General"]);
  });

  test("Create multiple questions and assign specific roles", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roles = ["General", "Role 1", "Role 2", "Role 3", "Role 4", "Role 5"];
    const questions = [
      { text: "Kubernetes", roles: ["Role 1", "Role 2"] },
      { text: "Docker", roles: ["Role 3"] },
      { text: "C#", roles: ["Role 4", "Role 5"] },
    ];

    // Create roles and store their IDs
    const roleIds: { [key: string]: string } = {};
    for (let role of roles) {
      roleIds[role] = await landingPage.createRole(role);
    }

    // Create questions
    for (let question of questions) {
      await landingPage.createQuestion(
        surveyId,
        question.roles.map((role) => roleIds[role] || ""),
        question.text,
      );
    }

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.selectRoles(["Role 1", "Role 3", "Role 5"]);
    await landingPage.navigateToSurveyPage();
    await landingPage.checkProgressionBarForRoles([
      "Role 1",
      "Role 3",
      "Role 5",
    ]);
  });

  test("if questions are visible in roles", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roles = ["General"];
    const questions = [
      { question: "Kubernetes", roles: ["General"] },
      { question: "Docker", roles: ["General"] },
      { question: "C#", roles: ["General"] },
    ];

    // Create roles and store their IDs
    const roleIds: { [key: string]: string } = {};
    for (let role of roles) {
      roleIds[role] = await landingPage.createRole(role);
    }

    // Create questions
    for (let question of questions) {
      await landingPage.createQuestion(
        surveyId,
        question.roles.map((roles) => roleIds[roles] || ""),
        question.question,
      );
    }

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();
    const questionsText = questions.map((question) => question.question);
    await landingPage.checkRoleForQuestion(questionsText);
  });

  test("Answer questions of a single role", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roles = ["General"];
    const questions = [
      { question: "Kubernetes", roles: ["General"] },
      { question: "Docker", roles: ["General"] },
      { question: "C#", roles: ["General"] },
    ];

    for (let i = 0; i < 4; i++) {
      await landingPage.createAnswerOption(i);
    }

    // Create roles and store their IDs
    const roleIds: { [key: string]: string } = {};
    for (let role of roles) {
      roleIds[role] = await landingPage.createRole(role);
    }

    // Create questions
    for (let question of questions) {
      await landingPage.createQuestion(
        surveyId,
        question.roles.map((roles) => roleIds[roles] || ""),
        question.question,
      );
    }

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = questions.map((question) => question.question);
    for (let i = 0; i < questionsText.length; i++) {
      await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
    }

    await landingPage.submitAnswers();
    await landingPage.checkUrl("thank-you");
  });

  test("Answer questions of multiple roles", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roles = ["General", "Role 1"];
    const questions = [
      { question: "Kubernetes", roles: ["General"] },
      { question: "Docker", roles: ["General", "Role 1"] },
      { question: "C#", roles: ["General", "Role 1"] },
    ];

    for (let i = 0; i < 4; i++) {
      await landingPage.createAnswerOption(i);
    }

    // Create roles and store their IDs
    const roleIds: { [key: string]: string } = {};
    for (let role of roles) {
      roleIds[role] = await landingPage.createRole(role);
    }

    // Create questions
    for (let question of questions) {
      await landingPage.createQuestion(
        surveyId,
        question.roles.map((roles) => roleIds[roles] || ""),
        question.question,
      );
    }

    // Check if the questions are created
    await landingPage.navigateToLandingPage();
    await landingPage.selectRoles(["Role 1"]);
    await landingPage.navigateToSurveyPage();

    // Answer the questions
    const questionsText = questions.map((question) => question.question);

    // Outer loop over the roles
    for (let j = 0; j < roles.length; j++) {
      // Inner loop over the questions
      for (let i = 0; i < questionsText.length; i++) {
        // Get the roles for the current question
        const questionRoles = questions[i]?.roles;

        // Check if the current role matches the roles of the current question
        if (questionRoles?.includes(roles[j] || "")) {
          await landingPage.selectAnswerOption(questionsText[i] || "", i % 4);
        }
      }

      // Check if it's the last role
      if (j === roles.length - 1) {
        await landingPage.submitAnswers();
      } else {
        await landingPage.goToNextQuestionsForDifferentRole();
      }
    }

    await landingPage.checkUrl("thank-you");
  });

  // tests to be written:
  // - check if forgetting to fill in questions shows error
  // - check if the percentage of the progressbar is updated
  // - mobile
  // - select communication preferences
  // - anominous results
  // - find the expert
  // - trying to reach certain URLs when not logged in.
});
