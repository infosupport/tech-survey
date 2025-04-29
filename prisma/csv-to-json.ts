import fs from "fs";
import csv from "csv-parser";

async function main() {
    const csvFilePath = "import/survey.csv";
    const jsonFilePath = "import/survey.json";

    const survey = {
        surveyDate: "2025-29-04",
        surveyName: "Info Support Tech Survey 2025",
        questions: [],
    };

    const roles: string[] = [];
    let firstColumn: string = "";
    let questions: {
        questionText: string;
        roles: {
            role: string;
            default: boolean;
        }[];
    }[] = [];

    fs.createReadStream(csvFilePath, { encoding: "utf-8" })
        .pipe(csv({ separator: "," }))
        .on("headers", (headers: string[]) => {
            roles.push(...headers);
            firstColumn = headers[0] ?? "Technologie";
        })
        .on("data", (data: Record<string, string>) => {
            const questionText: string = data[firstColumn] ?? "";

            const applicableRoles = roles.filter((role, index) => {
                if (!data[role]) {
                    return false;
                }
                return data[role].toLowerCase() === "x" && index !== 0;
            });

            const question = {
                questionText,
                roles: applicableRoles.map((role) => ({
                    id: role,
                    role: role,
                    default: true,
                })),
            };
            questions.push(question);
        })
        .on("end", () => {
            console.log(questions[0]);
        });
}

void main().catch(console.error);
