import { db } from "~/server/db";
import MyComponent from "../../components/download-pdf";
import React, { Suspense } from "react";
import { getServerAuthSession } from "~/server/auth";
import { type QuestionResult, type Question } from "~/models/types";
import { Login } from "../../components/login";
import { type Session } from "next-auth";
import { ModeToggle } from "../../components/mode-toggle";

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
    <main className="flex min-h-screen items-center justify-center">
      <div className="absolute right-4 top-4 z-50 flex items-center space-x-4">
        {session && (
          <Suspense fallback={<div>Loading...</div>}>
            {/* Assuming LoginWrapper is a component that wraps Login */}
            <LoginWrapper session={session} />
          </Suspense>
        )}
        <ModeToggle />
      </div>
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
          <Suspense fallback={<div>Loading...</div>}>
            <MyComponent userAnswersForRole={transformedData} />
          </Suspense>
        </div>
      </div>
    </main>
  );
};

const LoginWrapper: React.FC<{ session: Session }> = async ({ session }) => {
  return <Login session={session} />;
};

export default ThankYou;
