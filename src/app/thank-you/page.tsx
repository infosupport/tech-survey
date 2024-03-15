import { db } from "~/server/db";
import MyComponent from "../_components/download-pdf";
import React, { Suspense } from "react";
import { getServerAuthSession } from "~/server/auth";
import { type QuestionResult, type Question } from "~/models/types";

const ThankYou = async () => {
  const session = await getServerAuthSession();
  const userAnswersForRole: QuestionResult[] = await db.questionResult.findMany(
    {
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
    },
  );

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
          answers: [{ questionId: curr.questionId, answerId: curr.answerId }],
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
    <div>
      <h1>Thank You</h1>
      <p>Your form has been submitted successfully.</p>
      <Suspense fallback={<div>Loading...</div>}>
        <MyComponent userAnswersForRole={transformedData} />
      </Suspense>
    </div>
  );
};

export default ThankYou;
