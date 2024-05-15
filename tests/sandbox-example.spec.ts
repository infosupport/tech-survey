import { expect, test, type Page } from "@playwright/test";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { LandingPage } from "./landing-page";
import { promisify } from "util";
import { type ChildProcess, exec, spawn } from "child_process";
import { PrismaClient } from "@prisma/client";

const execAsync = promisify(exec);
const cwd = new URL("..", import.meta.url);

test.describe("using test containers", () => {
  let container: StartedPostgreSqlContainer;
  let client: PrismaClient;
  let nextProcess: ChildProcess;
  let landingPage: LandingPage;
  let page: Page;

  // Set up the test container and database before all tests
  test.beforeAll(async () => {
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
    page = await browser.newPage();
  });

  // Clean up the landing page after each test
  test.afterEach(async () => {
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

  test("Ensure that answer options can be created", async () => {
    for (let i = 0; i < 5; i++) {
      await landingPage.createAnswerOption(i);
    }

    // Check if the question has the correct answer options
    const answerOptions = await landingPage.getAnswerOptions();
    expect(answerOptions).toHaveLength(4);
  });

  test("Ensure that question results can be created", async () => {
    const surveyId = await landingPage.createSurvey("Survey");
    const roleId = await landingPage.createRole("General");
    const questionId = await landingPage.createQuestion(
      surveyId,
      [roleId],
      "What is your favorite color?",
    );
    const answerOptions = await landingPage.getAnswerOptions();

    // Create a user
    const user = await client.user.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        // Add any other relevant user data
      },
    });

    // Create a question result
    await client.questionResult.create({
      data: {
        userId: user.id,
        questionId: questionId,
        answerId: answerOptions[0]?.id ?? "",
      },
    });

    // Check if the question result is created
    const userQuestionResults = await client.user
      .findUnique({
        where: { id: user.id },
      })
      .questionResults();
    expect(userQuestionResults).toHaveLength(1);
    expect(userQuestionResults[0]?.questionId).toBe(questionId);
    expect(userQuestionResults[0]?.answerId).toBe(answerOptions[0]?.id);
  });
});
