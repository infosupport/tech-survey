import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";
const prisma = new PrismaClient();

// Define types for roles and role-question mapping
type Role = string;
type Question = string;
type RoleQuestionMapping = Map<Role, Question[]>;

// Function to parse the CSV file

// TODO: read if we are using ; or , as separator by checking header
function parseCSV(filePath: string): Promise<{
  roles: Role[];
  questions: Question[];
  roleQuestionsMapping: RoleQuestionMapping;
}> {
  return new Promise((resolve, reject) => {
    const roles: Role[] = [];
    const questions: Question[] = [];
    const roleQuestionsMapping: RoleQuestionMapping = new Map();

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("headers", (headers: string[]) => {
        // Extract roles from the first row
        roles.push(...headers);

        // // Remove the first element from the roles array (it's not a role)
        roles.shift();

        // // Remove the last element from the roles array (it's not a role)
        roles.pop();
      })
      .on("data", (row: Record<string, string>) => {
        // Extract question from the first column of the row
        const questionKey = Object.keys(row)[0] ?? "";

        const question: Question =
          (row[questionKey] ?? "")?.trim()?.split(";")[0] ?? "";
        questions.push(question);

        // Iterate over each role and check if the question applies
        for (let i = 1; i < Object.keys(row).length; i++) {
          const role = roles[i - 1];
          const rowKey = Object.keys(row)[i] ?? "";
          const rowValue = row[rowKey];
          if (rowValue?.includes("X")) {
            // Check if the question already exists in the mapping
            if (roleQuestionsMapping.has(question)) {
              // If yes, append the role to the existing array
              roleQuestionsMapping.get(question ?? "")?.push(role ?? "");
            } else {
              // If no, initialize a new array with the role
              roleQuestionsMapping.set(question ?? "", [role ?? ""]);
            }
          }
          if (rowValue?.includes("x")) {
            // Check if the question already exists in the mapping
            if (roleQuestionsMapping.has(question)) {
              // If yes, append the role to the existing array
              roleQuestionsMapping.get(question ?? "")?.push(role ?? "");
            } else {
              // If no, initialize a new array with the role
              roleQuestionsMapping.set(question ?? "", [role ?? ""]);
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

async function main() {
  // Read the CSV file
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

    // Create the roles and save the role objects in an array
    const roleObjects = [];
    for (const role of roles) {
      const newRole = await prisma.role.create({
        data: {
          role: role,
          default: role === "General" ? true : false,
        },
      });
      roleObjects.push(newRole);
    }

    // Create the questions based on the roleQuestionsMapping. For each question, connect the roles that are mapped to it
    for (const question of questions) {
      await prisma.question.create({
        data: {
          questionText: question,
          survey: {
            connect: { id: survey1.id },
          },

          // Look for the role names in the roleQuestionsMapping and connect them to the question via the role.id field
          roles: {
            connect: roleObjects
              .filter((role) =>
                roleQuestionsMapping.get(question)?.includes(role.role),
              )
              .map((role) => {
                return { id: role.id };
              }),
          },
        },
      });
    }

    // Finally, add the answer options
    const options = [0, 1, 2, 3];

    for (const option of options) {
      await prisma.answerOption.create({
        data: {
          option: option,
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
