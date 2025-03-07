import { DbHelper } from "./db-helper";
import * as fs from "fs";
import { TestSetup } from "./test-setup";
import {PrismaClient} from "@prisma/client";

async function setupDatabase() {
    console.log("Starting DbHelper.create()"); // Log start
    const dbHelper = await DbHelper.create();
    console.log("DbHelper.create() finished"); // Log finish

    const githubEnvPath = process.env.GITHUB_ENV;
    if (!githubEnvPath) {
        console.error("GITHUB_ENV environment variable not found.");
        process.exit(1);
    }

    const dbContainer = dbHelper.getContainer();
    // Construct DATABASE_URL using network alias and container port
    const username = dbContainer.getUsername();
    const password = dbContainer.getPassword();
    const databaseName = dbContainer.getDatabase();
    const containerPort = 5432; // PostgreSQL default container port
    const hostAlias = dbContainer.getHost();
    const connectionUri = `postgresql://${username}:${password}@${hostAlias}:${containerPort}/${databaseName}?connect_timeout=300`;
    console.log("Generated DATABASE_URL (using alias):", connectionUri); // Log the generated URL

    const host = dbHelper.getContainer().getHost();
    const port = dbHelper.getContainer().getPort();
    const database = dbHelper.getContainer().getDatabase();

    const envVars = {
        DATABASE_URL: connectionUri, //`postgresql://${username}:${password}@${host}:${port}/${database}`,
    };

    for (const [key, value] of Object.entries(envVars)) {
        fs.appendFileSync(githubEnvPath, `${key}=${value}\n`, {
            encoding: "utf8",
        });
    }

    process.env.DATABASE_URL = connectionUri;
    console.log("DATABASE_URL set in process.env:", process.env.DATABASE_URL); // Verify in process.env

    // Add a delay to ensure database is ready
    console.log("Waiting 5 seconds for database to initialize...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // 5 seconds delay
    console.log("Wait complete.");
    const testSetup = new TestSetup(dbHelper.getContainer());

    await testSetup.createSingleRoleSurvey(dbHelper);

    const ans = await dbHelper.getAnswerOptions();
    console.log("Answer options:", ans);

    const client = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: [
            {
                emit: "event",
                level: "query",
            },
        ],
    });

    try {
        await client.$connect();
        const answers = await client.answerOption.findMany();
        console.log("Answer options in test:", answers);
    } catch (error) {
        console.error("Error fetching answers:", error);
        throw error; // Re-throw to fail the step
    } finally {
        await client.$disconnect(); // Disconnect Prisma client
    }
}

setupDatabase().catch((error) => {
    console.error("Error in setup-database.ts:", error);
    process.exit(1);
});
