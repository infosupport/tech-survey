// @ts-check
import { PrismaDbClient } from "~/prisma";
import {
    PostgreSqlContainer,
    type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { exec } from "child_process";
import { promisify } from "util";

export class DbHelper {
    private client: PrismaDbClient | null = null;
    private container: StartedPostgreSqlContainer | null = null;
    private readonly execAsync = promisify(exec);
    private readonly cwd = new URL("..", import.meta.url);

    static async create(): Promise<DbHelper> {
        const dbHelper = new DbHelper();
        dbHelper.container = await new PostgreSqlContainer().start();
        dbHelper.client = await dbHelper.setupDatabase();
        return dbHelper;
    }

    getClient(): PrismaDbClient {
        if (!this.client) {
            throw new Error("PrismaClient has not been initialized");
        }
        return this.client;
    }

    getContainer(): StartedPostgreSqlContainer {
        if (!this.container) {
            throw new Error("Container has not been initialized");
        }
        return this.container;
    }

    async setupDatabase(): Promise<PrismaDbClient> {
        await this.execAsync("npm run db:push", {
            env: {
                ...process.env,
                DATABASE_URL: this.container!.getConnectionUri(),
            },
            cwd: this.cwd,
            encoding: "utf-8",
        });
        return new PrismaDbClient({
            datasources: {
                db: {
                    url: this.container!.getConnectionUri(),
                },
            },
            log: [
                {
                    emit: "event",
                    level: "query",
                },
            ],
        });
    }

    async cleanDatabase() {
        await this.getClient().questionResult.deleteMany();
        await this.getClient().answerOption.deleteMany();
        await this.getClient().question.deleteMany();
        await this.getClient().survey.deleteMany();
        await this.getClient().role.deleteMany();
    }
}
