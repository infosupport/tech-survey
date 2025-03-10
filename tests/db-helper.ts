// @ts-check
import { PrismaClient } from "@prisma/client";
import {
    PostgreSqlContainer,
    type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { exec } from "child_process";
import { promisify } from "util";

export class DbHelper {
    private client: PrismaClient | null = null;
    private container: StartedPostgreSqlContainer | null = null;
    private readonly execAsync = promisify(exec);
    private readonly cwd = new URL("..", import.meta.url);

    static async create(): Promise<DbHelper> {
        const dbHelper = new DbHelper();
        dbHelper.container = await new PostgreSqlContainer().start();
        dbHelper.client = await dbHelper.setupDatabase();
        return dbHelper;
    }

    private getClient(): PrismaClient {
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

    async setupDatabase(): Promise<PrismaClient> {
        await this.execAsync("npm run db:push", {
            env: {
                ...process.env,
                DATABASE_URL: this.container!.getConnectionUri(),
            },
            cwd: this.cwd,
            encoding: "utf-8",
        });
        return new PrismaClient({
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

    async createSurvey(surveyName: string): Promise<string> {
        const surveyExists = await this.getClient().survey.findUnique({
            where: {
                surveyName: surveyName,
            },
        });

        if (surveyExists) {
            return surveyExists.id;
        }

        const survey = await this.getClient().survey.create({
            data: {
                surveyName: surveyName,
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
        const questionExists = await this.getClient().question.findFirst({
            where: {
                questionText: questionText,
            },
        });

        if (questionExists) {
            return questionExists.id;
        }

        const question = await this.getClient().question.create({
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
        const answerOptionExists =
            await this.getClient().answerOption.findFirst({
                where: {
                    option: option,
                },
            });

        if (answerOptionExists) {
            return answerOptionExists.id;
        }

        await this.getClient().answerOption.create({
            data: {
                option: option,
            },
        });
    }

    async createRole(roleName: string) {
        // retrieve all existing roles
        const roles = await this.getClient().role.findMany();
        const roleExists = roles.find((role) => role.role === roleName);

        if (roleExists) {
            return roleExists.id;
        }

        const role = await this.getClient().role.create({
            data: {
                role: roleName,
                default: roleName === "General",
            },
        });
        return role.id;
    }

    async createUser(name: string, email: string) {
        // Check if user already exists
        const userExists = await this.getClient().user.findUnique({
            where: {
                email: email,
            },
        });

        if (userExists) {
            return userExists.id;
        }

        const user = await this.getClient().user.create({
            data: {
                name: name,
                email: email,
            },
        });
        return user.id;
    }

    async cleanDatabase() {
        await this.getClient().questionResult.deleteMany();
        await this.getClient().answerOption.deleteMany();
        await this.getClient().question.deleteMany();
        await this.getClient().survey.deleteMany();
        await this.getClient().role.deleteMany();
    }
}
