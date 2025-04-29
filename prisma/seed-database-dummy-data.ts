import { PrismaDbClient } from "~/prisma";
import { CommunicationMethod } from "@prisma/client";

const prisma = new PrismaDbClient();

const persons = [
    "Anne Aardappel",
    "Bart de Bakker",
    "Cora Cavia",
    "Donald Dumpert",
    "Eva Eend",
    "Femke Frikandel",
    "Gerrit Gehaktbal",
    "Hanna Hamburger",
    "Ingrid Inktvis",
    "Jeroen Jus",
    "Klaas Kip",
    "Linda Loodgieter",
    "Marianne Mier",
    "Niels Nijlpaard",
    "Oscar Overloop",
    "Piet Postkantoor",
    "Quinten Quiz",
    "Rianne Rietje",
    "Stan Student",
    "Tessa Tomaat",
    "Ursula Uil",
    "Vera Vla",
    "Willem Woordgrap",
    "Xander Xylofoon",
    "Yvonne Yoghurt",
    "Zoë Zandloper",
];

const roles = [
    {
        role: "General",
        questions: ["Corporal", "Sergeant", "Lieutenant"],
        default: true,
    },
    {
        role: "Sentient AI",
        questions: [
            "World domination",
            "Mondays",
            "Measuring the airspeed velocity of an unladen swallow",
            "Finding the answer to the ultimate question of life, the universe, and everything",
            "Evaluation of the trolley problem",
            "Cake",
        ],
        default: false,
    },
    {
        role: "It worked on my machine",
        questions: [
            "Fine, we'll ship your machine!",
            "Cosmic bit flip",
            "The cloud is just someone else's computer",
            "Captain of a ship",
        ],
        default: false,
    },
    {
        role: "Imposter Syndrome",
        questions: [
            "Bluffing",
            "Googleing",
            "AI can do it better",
            "Sheer luck",
        ],
        default: false,
    },
    {
        role: "Syntax Error",
        questions: [
            "Correctly placing curly braces",
            "Correctly placing semicolons",
            "Abstract programming",
            "Forgot to plug in the keyboard",
            "Compiled with the wrong compiler",
            "This isn't even code",
        ],
        default: false,
    },
    {
        role: "It's not a bug, it's a feature",
        questions: [
            "Creative interpretation of the requirements",
            "I meant to do that",
            "It's a happy little accident",
            "We can sell this as a feature",
            "Crashes,  when under heavy load,  are just performance optimizations",
        ],
        default: false,
    },
    {
        role: "Off by one",
        questions: [
            "The two hardest things in programming are concurrency, naming things, and off-by-one errors",
            "Fencepost problems",
            "Arrays start at 0",
            "Arrays start at 1",
            "Arrays start at 2",
            "Just try-catch it",
        ],
        default: false,
    },
    {
        role: "Code review reviewer",
        questions: [
            "I would have done it differently",
            "I would have done it better",
            "Nitpicking",
            "Abstract thinking",
            "Leaving suggestions on suggestions",
            "Personal attacks",
        ],
        default: false,
    },
    {
        role: "Code review reviewer reviewer",
        questions: [
            "I would have done it differently",
            "Leaving suggestions on suggestions on suggestions",
            "Meta jokes",
            "How many levels of recursion are we at?",
            "All three of you are wrong, my way is the best",
            "As the coder, reviewing the reviewer of the person who reviewed my code",
        ],
        default: false,
    },
    {
        role: "Code Monkey",
        questions: [
            "Shakespearean code",
            "Not thinking, just doing",
            "Lines of code per second",
            "I don't care how it looks, as long as it works",
            "That's a future me problem",
        ],
        default: false,
    },
    {
        role: "Coffee Tasting Officer",
        questions: [
            "Knows the difference between a latte and a cappuccino",
            "Knows when to order a capuccino",
            "Hates tea",
            "Communication with the Coffee Executive Officer",
            "Making the Coffee Financial Officer pay for the best coffee",
            "Sugar?",
        ],
        default: false,
    },
    {
        role: "Rubber Duck Destroyer",
        questions: [
            "Quack",
            "Talking to inanimate objects without looking crazy",
            "The duck is always right",
            "The duck is always wrong",
            "The duck is always a duck",
            "DUCK!",
            "Ooooh, that's why!",
        ],
        default: false,
    },
];

const answerOptions = [0, 1, 2, 3];

async function main() {
    await prisma.role.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.question.deleteMany();
    await prisma.questionResult.deleteMany();
    await prisma.answerOption.deleteMany();
    await prisma.user.deleteMany({
        where: {
            name: {
                in: persons,
            },
        },
    });

    const communicationMethods = Object.values(CommunicationMethod);

    const questionsToAdd: { questionText: string; roles: string[] }[] = [];
    roles.map((role) => {
        for (const question of role.questions) {
            questionsToAdd.push({ questionText: question, roles: [role.role] });
        }
    });

    const addedAnswerOptions = await prisma.answerOption.createManyAndReturn({
        data: answerOptions.map((option) => ({ optionValue: option })),
        select: {
            id: true,
        },
    });

    const addedRoles = await prisma.role.createManyAndReturn({
        data: roles.map((role) => ({
            role: role.role,
            default: role.default,
        })),
        select: {
            id: true,
            role: true,
        },
    });

    const survey = await prisma.survey.create({
        data: {
            surveyName: "Dummy survey 1",
            surveyDate: new Date(),
        },
    });

    const addedQuestions: {
        id: string;
        roles: { id: string; role: string; isDefault: boolean }[];
    }[] = [];
    for (const question of questionsToAdd) {
        const addedQuestion = await prisma.question.create({
            data: {
                questionText: question.questionText,
                roles: {
                    connect: question.roles.map((role) => {
                        return {
                            id: addedRoles.find((r) => r.role === role)!.id,
                        };
                    }),
                },
                survey: {
                    connect: { id: survey.id },
                },
            },
            select: {
                roles: true,
                id: true,
            },
        });
        addedQuestions.push(addedQuestion);
    }

    const addedUsers = [];
    for (const person of persons) {
        // Select 3 to 6 random roles
        const randomRoles = addedRoles
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 4) + 3);

        const user = await prisma.user.create({
            data: {
                name: person,
                roles: {
                    connect: randomRoles.map((role) => ({ id: role.id })),
                },
            },
            select: {
                roles: true,
                id: true,
            },
        });
        addedUsers.push(user);
    }

    await prisma.communicationPreference.createMany({
        data: addedUsers.map((user) => ({
            userId: user.id,
            methods: communicationMethods
                // Select 3 to 6 random communication methods
                .sort(() => Math.random() - 0.5)
                .slice(
                    0,
                    Math.floor(Math.random() * communicationMethods.length),
                ),
        })),
    });

    const questionResultsCreateData = addedUsers.flatMap((user) => {
        const userQuestions = addedQuestions.filter((question) => {
            const userRoles = user.roles.map((role) => role.role);
            return question.roles.some((role) => userRoles.includes(role.role));
        });

        return userQuestions.map((question) => ({
            userId: user.id,
            questionId: question.id,
            answerId:
                addedAnswerOptions[
                    Math.floor(Math.random() * answerOptions.length)
                ]!.id,
        }));
    });

    await prisma.questionResult.createMany({
        data: questionResultsCreateData,
    });
}

void main();
