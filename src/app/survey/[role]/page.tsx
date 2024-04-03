import { getServerAuthSession } from "~/server/auth";
import { type AnswerOption, type Question } from "~/models/types";
import { Suspense } from "react";
import { SurveyQuestionnaire } from "~/components/survey-questionnaire";
import SurveyQuestionLoader from "~/components/loading/survey-question-loader";
import { db } from "~/server/db";

import { type Metadata } from "next";
import { createNewUserAndSession } from "~/utils/stress-test-utils";

export const metadata: Metadata = {
  title: "Survey",
};

const SuspenseSurveyData = () => (
  <Suspense fallback={<SurveyQuestionLoader />}>
    <SurveyPage />
  </Suspense>
);

const SurveyPage: React.FC = async () => {
  let session = await getServerAuthSession();

  if (!session) {
    session = await createNewUserAndSession();
    if (!session) {
      return <div>Unauthenticated</div>;
    }
  }

  const [questions, answerOptions, userRoles, userAnswersForRole] =
    await Promise.all([
      db.question.findMany({
        include: {
          roles: true,
        },
      }),
      db.answerOption.findMany(),
      db.user
        .findUnique({
          where: {
            id: session.user.id,
          },
          select: {
            roles: true,
          },
        })
        .then((user) => user?.roles),
      db.questionResult.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          question: {
            include: {
              roles: true,
            },
          },
        },
      }),
    ]);

  const userSelectedRoles = userRoles ?? [];

  const formattedQuestions: Question[] = questions.map((question) => ({
    id: question.id,
    surveyId: question.surveyId,
    questionText: question.questionText,
    roleIds: question.roles.map((role) => role.id),
  }));

  const formattedAnswerOptions: AnswerOption[] = answerOptions.map(
    (answerOption) => ({
      id: answerOption.id,
      option: answerOption.option,
    }),
  );

  return (
    <div>
      {process.env.STRESS_TEST === "true" && (
        <div>UserId:{session.user.id}</div>
      )}

      <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
        <SurveyQuestionnaire
          session={session}
          questions={formattedQuestions}
          answerOptions={formattedAnswerOptions}
          userSelectedRoles={userSelectedRoles}
          userAnswersForRole={userAnswersForRole}
        />
      </div>
    </div>
  );
};
export default SuspenseSurveyData;
