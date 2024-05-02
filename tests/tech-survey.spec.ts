import { test } from "@playwright/test";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { LandingPage } from "./landing-page";
import { SurveyPage } from "./survey-page";
import { slugify } from "~/utils/slugify";
import { promisify } from "util";
import { type ChildProcess, exec, spawn } from "child_process";
import { PrismaClient } from "@prisma/client";

let selectedRoles: string[] = [];
const execAsync = promisify(exec);
const cwd = new URL("..", import.meta.url);

test.describe("using test containers", () => {
  let container: StartedPostgreSqlContainer;
  let client: PrismaClient;
  let nextProcess: ChildProcess;
  let landingPage: LandingPage;
  test.beforeAll(async ({page}) => {
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
    const port = await portPromise;
    landingPage = new LandingPage(page, port);
  });

  test.afterAll(async () => {
    nextProcess.kill();
    await container.stop();
  });

  test("should count questions", async () => {
    const questionCount = await client.question.count();
    console.log(questionCount);
  });
});

const navigateAndCheckSurveyPage = async (
  landingPage: LandingPage,
  surveyPage: SurveyPage,
  roles?: string[],
) => {
  await landingPage.navigateToLandingPage();
  if (roles) {
    selectedRoles = roles;
  } else {
    selectedRoles = (await landingPage.selectRandomRoles()).filter(
      (role): role is string => typeof role === "string",
    );
  }
  await landingPage.navigateToSurveyPage();
  await surveyPage.getCurrentURL();
  const sortedSelectedRoles =
    await surveyPage.isProgressionBarUpdated(selectedRoles);

  return sortedSelectedRoles;
};

test("New user logs in and navigates to survey", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  await navigateAndCheckSurveyPage(landingPage, surveyPage, ["General"]);
});

test("New user selects multiple roles", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  await navigateAndCheckSurveyPage(landingPage, surveyPage);
});

test("User attempts to navigate to different /survey/ page in the nav bar with all questions been filled in", async ({
  page,
}) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  const selectedRoles = await navigateAndCheckSurveyPage(
    landingPage,
    surveyPage,
  );

  await surveyPage.fillInQuestions(
    `http://localhost:3000/survey/${slugify(selectedRoles[1] ?? "")}`,
  );
});

test("User attempts to navigate to different /survey/ page in the nav bar without all questions been filled in", async ({
  page,
}) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  const selectedRoles = await navigateAndCheckSurveyPage(
    landingPage,
    surveyPage,
  );
  await surveyPage.fillInQuestions(
    `http://localhost:3000/survey/${slugify(selectedRoles[1] ?? "")}`,
    true,
  );
});

test("User fills in complete survey correctly", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  const selectedRoles = await navigateAndCheckSurveyPage(
    landingPage,
    surveyPage,
  );

  for (let i = 0; i < selectedRoles.length; i++) {
    const isLastRole = i === selectedRoles.length - 1;
    const nextUrl = isLastRole
      ? "http://localhost:3000/thank-you"
      : `http://localhost:3000/survey/${slugify(selectedRoles[i + 1] ?? "")}`;

    await surveyPage.fillInQuestions(nextUrl, false, isLastRole);
  }
});
