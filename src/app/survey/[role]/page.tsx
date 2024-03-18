import { getServerAuthSession } from "~/server/auth";
import { type AnswerOption, type Question } from "~/models/types";
import { Suspense } from "react";
import { SurveyQuestionnaire } from "~/components/survey-questionnaire";
import Loading from "~/app/loading";
import { db } from "~/server/db";

// Wrap the asynchronous data fetching with Suspense
const SuspenseSurveyData = () => (
  <Suspense fallback={<Loading />}>
    <SurveyPage />
  </Suspense>
);

const SurveyPage: React.FC = async () => {
  const session = await getServerAuthSession();

  if (!session) {
    return <div>Unauthenticated</div>;
  }

  const [questions, answerOptions, userRoles, userAnswersForRole] =
    await Promise.all([
      // Delayed call to simulate slow API
      // new Promise((resolve) => setTimeout(resolve, 3000)).then(() =>
      db.question.findMany({
        include: {
          roles: true,
        },
      }),
      // ),
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
    <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
      <SurveyQuestionnaire
        session={session}
        questions={formattedQuestions}
        answerOptions={formattedAnswerOptions}
        userSelectedRoles={userSelectedRoles}
        userAnswersForRole={userAnswersForRole}
      />
    </div>
  );
};
export default SuspenseSurveyData;
