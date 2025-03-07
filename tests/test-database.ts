import { DbHelper } from "./db-helper";
import * as fs from "fs";
import { TestSetup } from "./test-setup";
import { PrismaClient } from "@prisma/client";

async function testDatabase() {
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

    const answers = await client.answerOption.findMany();
    console.log("Answer options:", answers);
}

testDatabase().catch((error) => {
    console.error("Error in test-database.ts:", error);
    process.exit(1);
});
