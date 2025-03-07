import { DbHelper } from "./db-helper";
import * as fs from "fs";

const dbHelper = await DbHelper.create();
console.log(dbHelper.getContainer().getDatabase());
console.log(dbHelper.getContainer().getPort());
console.log(dbHelper.getContainer().getHost());
console.log(dbHelper.getContainer().getUsername());
console.log(dbHelper.getContainer().getPassword());

const githubEnvPath = process.env.GITHUB_ENV;
if (!githubEnvPath) {
    console.error("GITHUB_ENV environment variable not found.");
    process.exit(1);
}

const username = dbHelper.getContainer().getUsername();
const password = dbHelper.getContainer().getPassword();
const host = "postgres";
const port = dbHelper.getContainer().getPort();
const database = dbHelper.getContainer().getDatabase();

const envVars = {
    DATABASE_URL: `postgresL//${username}:${password}@${host}:${port}/${database}`,
};

for (const [key, value] of Object.entries(envVars)) {
    fs.appendFileSync(githubEnvPath, `${key}=${value}\n`, { encoding: "utf8" });
}

process.env.DATABASE_URL = dbHelper.getContainer().getConnectionUri();
