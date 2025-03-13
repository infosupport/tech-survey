import { type ChildProcess, spawn } from "child_process";
import type { Browser, Page } from "@playwright/test";
import { type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { encode, type DefaultJWT } from "next-auth/jwt";
import treeKill from "tree-kill";
import { promisify } from "node:util";
import { USER_EMAIL, USER_NAME, UserDbHelper } from "~/tests/helpers/db/user";
import { DbHelper } from "~/tests/helpers/db";

const treeKillAsPromised = promisify(treeKill);
const killAllProcesses = async (process: ChildProcess) => {
    if (process?.pid) {
        await treeKillAsPromised(process.pid);
    }
};

export class TestSetup {
    private readonly cwd = new URL("..", import.meta.url);
    private container: StartedPostgreSqlContainer | null;

    constructor(container: StartedPostgreSqlContainer) {
        this.container = container;
    }

    static async setup(browser: Browser, withUserAndSession: boolean) {
        const page = await browser.newPage();
        const dbHelper = await DbHelper.create();
        const testSetup = new TestSetup(dbHelper.getContainer());
        const { port, nextProcess } = await testSetup.#setupNextProcess();

        if (withUserAndSession) {
            await testSetup.#setupUserAndSession(
                page,
                new UserDbHelper(dbHelper.getClient()),
            );
        }

        return {
            page,
            dbHelper,
            testSetup,
            port,
            nextProcess,
            cleanup: async () => {
                await page.close();
                await dbHelper.stop();
                await killAllProcesses(nextProcess);
            },
        };
    }

    async #setupNextProcess(): Promise<{
        port: number;
        nextProcess: ChildProcess;
    }> {
        return new Promise<{ port: number; nextProcess: ChildProcess }>(
            (res, rej) => {
                const nextProcess = spawn(
                    "npm",
                    ["run", "start", "--", "--port", "0"],
                    {
                        cwd: this.cwd,
                        shell: true,
                        stdio: "pipe",
                        env: {
                            ...process.env,
                            DATABASE_URL: this.container!.getConnectionUri(),
                        },
                    },
                );
                nextProcess.stdout.on("data", (chunk: Buffer) => {
                    const str = chunk.toString();
                    process.stdout.write(str);
                    const portMatch = /local:\s*http:\/\/.+:(\d+)/gim.exec(str);
                    if (portMatch) {
                        res({
                            port: parseInt(portMatch[1]!),
                            nextProcess: nextProcess,
                        });
                    }
                });
                nextProcess.stderr.on("data", (chunk: Buffer) => {
                    process.stderr.write(chunk);
                });
                nextProcess.on("error", (err) => rej(err));
            },
        );
    }

    async #setupSessionCookie(page: Page, tokenValue: string): Promise<void> {
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

    async #setupUserAndSession(
        page: Page,
        userDbHelper: UserDbHelper,
    ): Promise<void> {
        const userId = await userDbHelper.createUser(USER_NAME, USER_EMAIL);

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
                secret: process.env["AUTH_SECRET"] ?? "dummy",
            });
        };

        const tokenValue = await token();

        if (tokenValue) {
            await this.#setupSessionCookie(page, tokenValue);
        } else {
            throw new Error("Failed to create token");
        }
    }
}
