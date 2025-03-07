import { DbHelper } from "./db-helper";
import * as fs from "fs";

const dbHelper = await DbHelper.create();

const githubEnvPath = process.env.GITHUB_ENV;
if (!githubEnvPath) {
    console.error("GITHUB_ENV environment variable not found.");
    process.exit(1);
}

const envVars = {
    DATABASE_URL: dbHelper.getContainer().getConnectionUri(),
};

for (const [key, value] of Object.entries(envVars)) {
    fs.appendFileSync(githubEnvPath, `${key}=${value}\n`, { encoding: "utf8" });
}

console.log("Look here", dbHelper.getContainer().getConnectionUri());
process.env.DATABASE_URL = dbHelper.getContainer().getConnectionUri();
