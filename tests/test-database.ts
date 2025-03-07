import { PrismaClient } from "@prisma/client";

async function testDatabase() {
    console.log("DATABASE_URL in test-database:", process.env.DATABASE_URL); // Log DATABASE_URL

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

testDatabase().catch((error) => {
    console.error("Error in test-database.ts:", error);
    process.exit(1);
});
