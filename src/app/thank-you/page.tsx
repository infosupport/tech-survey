import { db } from "~/server/db";
import PdfDownloadButton from "~/components/download-pdf";
import React, { Suspense } from "react";
import { getServerAuthSession } from "~/server/auth";
import {
    type QuestionResult,
    type Question,
    type AnswerOption,
} from "~/models/types";

import { type Metadata } from "next";
import ButtonSkeleton from "~/components/loading/button-loader";

export const metadata: Metadata = {
    title: "Thank You",
};

const ThankYou = async () => {
    const session = await getServerAuthSession();
    const userAnswersForRole: QuestionResult[] =
        await db.questionResult.findMany({
            where: {
                userId: session?.user.id,
            },
            include: {
                question: {
                    include: {
                        roles: true,
                    },
                },
            },
        });

    const answerOptions: AnswerOption[] = await db.answerOption.findMany();

    const userSelectedRoles = await db.user.findUnique({
        where: {
            id: session?.user.id,
        },
        include: {
            roles: true,
        },
    });

    // Update the userAnswersForRole object such that a question only includes the roles of the selected roles of the user.
    for (const userAnswer of userAnswersForRole) {
        userAnswer.question.roles = userAnswer.question.roles?.filter((role) =>
            userSelectedRoles?.roles.some(
                (selectedRole) => selectedRole.id === role.id,
            ),
        );
    }

    const transformedData = userAnswersForRole.reduce(
        (acc, curr) => {
            const existingQuestion = acc.find(
                (item) => item.question.id === curr.question.id,
            );

            if (existingQuestion) {
                existingQuestion.answers.push({
                    questionId: curr.questionId,
                    answerId: curr.answerId,
                });
            } else {
                acc.push({
                    question: curr.question,
                    answers: [
                        {
                            questionId: curr.questionId,
                            answerId: curr.answerId,
                        },
                    ],
                });
            }

            return acc;
        },
        [] as {
            question: Question;
            answers: { questionId: string; answerId: string }[];
        }[],
    );

    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                Thank <span className="text-custom-primary sm:inline">You</span>
            </h1>
            <p className="text-center">
                Your answers to the Info Support Tech Survey has been submitted
                successfully. <br />
                We appreciate your time and effort in completing the survey.
            </p>
            <div className="w-full max-w-3xl">
                <Suspense fallback={<ButtonSkeleton />}>
                    <PdfDownloadButton
                        userAnswersForRole={transformedData}
                        answerOptions={answerOptions}
                        session={session!}
                    />
                </Suspense>
            </div>
        </div>
    );
};

export default ThankYou;
