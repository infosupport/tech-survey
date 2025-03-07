import { DbHelper } from "./db-helper";
import * as fs from "fs";
import { TestSetup } from "./test-setup";

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
    const connectionUri = dbContainer.getConnectionUri();
    console.log("Generated DATABASE_URL:", connectionUri); // Log the generated URL

    const username = dbHelper.getContainer().getUsername();
    const password = dbHelper.getContainer().getPassword();
    const host = dbHelper.getContainer().getHost();
    const port = dbHelper.getContainer().getPort();
    const database = dbHelper.getContainer().getDatabase();

    const envVars = {
        DATABASE_URL: `postgresql://${username}:${password}@${host}:${port}/${database}`,
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
}

setupDatabase().catch((error) => {
    console.error("Error in setup-database.ts:", error);
    process.exit(1);
});
