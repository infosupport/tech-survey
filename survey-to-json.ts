/* Extract a survey to a JSON file
 * Can be used in the survey upload page to upload a survey
 * Usage: tsx questions-to-csv.ts
 * Output: survey.json
 */

import { PrismaDbClient } from "~/prisma";
import fs from "fs";

const prisma = new PrismaDbClient();

async function questionsToJSON() {
    const survey = await prisma.survey.findFirst({
        orderBy: {
            surveyDate: "desc",
        },
        select: {
            surveyName: true,
            surveyDate: true,
            questions: {
                select: {
                    questionText: true,
                    roles: true,
                },
            },
        },
    });

    const json = JSON.stringify(survey, null, 4);

    fs.writeFileSync("survey.json", json);
}

void questionsToJSON();
