import { test } from "@playwright/test";
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
  test.beforeAll(async ({ page }) => {
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
