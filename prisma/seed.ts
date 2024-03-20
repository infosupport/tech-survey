import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";
const prisma = new PrismaClient();

// Define types for roles and role-question mapping
type Role = string;
type Question = string;
type RoleQuestionMapping = Map<Role, Question[]>;

// Function to parse the CSV file
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
      .on("headers", (headers) => {
        // Extract roles from the first row
        roles.push(...headers);

        // // Remove the first element from the roles array (it's not a role)
        roles.shift();

        // // Remove the last element from the roles array (it's not a role)
        roles.pop();
      })
      .on("data", (row) => {
        // Extract question from the first column of the row
        const question: Question = row[Object.keys(row)[0]]
          .trim()
          .split(";")[0];
        questions.push(question);

        // Iterate over each role and check if the question applies
        for (let i = 1; i < Object.keys(row).length; i++) {
          const role = roles[i - 1];
          // Check for 'X' in the column, ignoring any additional characters
          if (row[Object.keys(row)[i]]?.includes("X")) {
            // Check if the question already exists in the mapping
            if (roleQuestionsMapping.has(question)) {
              // If yes, append the role to the existing array
              roleQuestionsMapping.get(question)?.push(role);
            } else {
              // If no, initialize a new array with the role
              roleQuestionsMapping.set(question, [role]);
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
  try {
    const { roles, questions, roleQuestionsMapping } =
      await parseCSV("survey.csv");
    console.log("Roles:", roles);
    console.log("Questions:", questions);
    console.log("Role-Question Mapping:");
    roleQuestionsMapping.forEach((mappedQuestions, role) => {
      console.log(role + ":", mappedQuestions);
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }

  //   const survey1 = await prisma.survey.create({
  //     data: {
  //       surveyName: "Info Support Tech Survey - 2024",
  //     },
  //   });

  //     // Create the roles
  //     const roles =

  //   const role1 = await prisma.role.create({
  //     data: {
  //       role: "general",
  //       default: true,
  //     },
  //   });

  //   const role2 = await prisma.role.create({
  //     data: {
  //       role: "Way of Working (WoW)",
  //       default: false,
  //     },
  //   });

  //   const question1 = await prisma.question.create({
  //     data: {
  //       questionText: "How many years of experience do you have?",
  //       survey: {
  //         connect: { id: survey1.id },
  //       },
  //       roles: {
  //         connect: [{ id: role1.id }, { id: role2.id }], // Assuming role2 exists in the database
  //       },
  //     },
  //   });

  //   const question2 = await prisma.question.create({
  //     data: {
  //       questionText: "What is your favorite feature of our product?",
  //       survey: {
  //         connect: { id: survey1.id },
  //       },
  //       roles: {
  //         connect: [{ id: role2.id }], // Assuming role2 exists in the database
  //       },
  //     },
  //   });

  // Finally, add the answer options
  //   const options = [1, 2, 3, 4];

  //   for (const option of options) {
  //     await prisma.answerOption.create({
  //       data: {
  //         option: option,
  //       },
  //     });
  //   }
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
