import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

/**
 * Parses a CSV file to extract roles, questions, and their mappings.
 * @param {string} filePath - Path to the CSV file.
 * @returns {Promise<{ roles: string[], questions: string[], roleQuestionsMapping: Map<string, string[]> }>} An object containing roles, questions, and their mappings.
 */
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        /** @type {string[]} */
        const roles = [];

        /** @type {string[]} */
        const questions = [];

        /** @type {Map<string, string[]>} */
        const roleQuestionsMapping = new Map();

        fs.createReadStream(filePath, { encoding: "utf-8" })
            .pipe(csv({ separator: ";" }))
            .on("headers", (/** @type {string[]} */ headers) => {
                roles.push(...headers.slice(1, -1));
            })
            .on("data", (/** @type {Record<string, string>} */ row) => {
                /** @type {string} */
                const questionKey = Object.keys(row)[0] ?? "";
                /** @type {string} */
                const question =
                    (row[questionKey] ?? "").trim().split(";")[0] ?? "";
                questions.push(question);

                for (const key of Object.keys(row)) {
                    if (key !== questionKey) {
                        const role = key;
                        const rowValue = row[key];
                        if (rowValue?.toLowerCase().includes("x")) {
                            if (roleQuestionsMapping.has(question)) {
                                roleQuestionsMapping.get(question)?.push(role);
                            } else {
                                roleQuestionsMapping.set(question, [role]);
                            }
                        }
                    }
                }
            })
            .on("end", () => {
                resolve({ roles, questions, roleQuestionsMapping });
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}

/**
 * Parses a CSV file to extract businessUnits
 * @param {string} filePath - Path to the CSV file.
 * @returns {Promise<{ businessUnits: string[]}>} An object containing businessUnits
 */
function parseCSVBusinessUnit(filePath) {
    return new Promise((resolve, reject) => {
        /** @type {string[]} */
        const businessUnits = [];

        fs.createReadStream(filePath, { encoding: "utf-8" })
            .pipe(csv({ separator: ";" }))
            .on("data", (/** @type {Record<string, string>} */ row) => {
                /** @type {string} */
                const unitKey = Object.keys(row)[0] ?? "";
                businessUnits.push(row[unitKey] ?? "");
            })
            .on("end", () => {
                console.log(businessUnits);
                resolve({ businessUnits });
            })
            .on("error", (error) => {
                reject(error);
            });
    });
}

/**
 * Main function to seed the database with survey data.
 * @returns {Promise<void>} A Promise that resolves when seeding is complete.
 */
async function main() {
    /** @type {{ id: string; surveyName: string }} */
    const survey1 = await prisma.survey.upsert({
        where: { surveyName: "Info Support Tech Survey - 2024" },
        create: {
            surveyName: "Info Support Tech Survey - 2024",
        },
        update: {},
    });

    try {
        const { roles, questions, roleQuestionsMapping } = await parseCSV(
            "./import/survey.csv",
        );
        console.log("Roles:", roles);
        console.log("Questions:", questions);
        console.log("Role-Question Mapping:");
        roleQuestionsMapping.forEach((mappedQuestions, role) => {
            console.log(role + ":", mappedQuestions);
        });

        const roleObjects = [];
        for (const role of roles) {
            const newRole = await prisma.role.create({
                data: {
                    role: role,
                    default: role === "General",
                },
            });
            roleObjects.push(newRole);
        }

        for (const question of questions) {
            await prisma.question.create({
                data: {
                    questionText: question,
                    survey: {
                        connect: { id: survey1.id },
                    },
                    roles: {
                        connect: roleObjects.filter((role) =>
                            roleQuestionsMapping
                                .get(question)
                                ?.includes(role.role),
                        ),
                    },
                },
            });
        }

        const options = [0, 1, 2, 3];
        for (const option of options) {
            await prisma.answerOption.create({
                data: {
                    option: option,
                },
            });
        }

        const { businessUnits } = await parseCSVBusinessUnit(
            "./import/businessUnits.csv",
        );
        for (const unit in businessUnits) {
            await prisma.businessUnit.create({
                data: {
                    unit: businessUnits[unit] ?? "",
                },
            });
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
