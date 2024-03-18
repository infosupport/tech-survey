"use client";

import {
  type Role,
  type AnswerOption,
  type Question,
  type QuestionResult,
} from "~/models/types";
import { usePathname, notFound } from "next/navigation";
import { useState } from "react";
import { type Session } from "next-auth";
import { slugToId, slugify } from "~/utils/slugify";

import ProgressionBar from "./progression-bar";
import useScreenSize from "./useScreenSize";
import { MobileSurveyQuestionnaire } from "./mobile/survey-questions";
import { SurveyQuestions } from "./survey-questions";
import { MobileProgressionBar } from "./mobile/progression-bar";

export function SurveyQuestionnaire({
  session,
  questions,
  answerOptions,
  userSelectedRoles,
  userAnswersForRole,
}: {
  session: Session;
  questions: Question[];
  answerOptions: AnswerOption[];
  userSelectedRoles: Role[];
  userAnswersForRole: QuestionResult[];
}) {
  const [selectedRoles] = useState<string[]>(
    userSelectedRoles.map((role) => role.id),
  );
  const pathname = usePathname() || "";

  // get the current role from the url, which is /survey/[role]
  const currentRole = pathname.split("/").pop() ?? "";
  if (!slugToId[currentRole]) {
    notFound();
  }

  const filteredQuestions = questions.filter(
    (question) =>
      question.roleIds?.some(
        (roleId) => roleId === slugToId[currentRole ?? ""],
      ) && selectedRoles.includes(slugToId[currentRole ?? ""] ?? ""),
  );

  // function that check if a user already has more than 1 response for a question
  function hasAnsweredAllQuestionsForRole(
    userAnswersForRole: QuestionResult[],
    roleId: string,
    questions: Question[],
  ) {
    const questionsForRole = userAnswersForRole.filter((answer) =>
      answer.question.roles?.some((role) => role.id === roleId),
    );

    const totalQuestionsForRole = questions.filter((question) =>
      question.roleIds?.some((role) => role === roleId),
    ).length;

    const answeredQuestionsForRole = questionsForRole.filter(
      (answer) => answer.answerId !== undefined,
    );

    return answeredQuestionsForRole.length >= totalQuestionsForRole;
  }

  const selectedRolesForProgressBar = userSelectedRoles
    .sort((a, b) => {
      const roleA = a.role.toLowerCase();
      const roleB = b.role.toLowerCase();

      if (roleA === "general") return -1;
      if (roleB === "general") return 1;

      return 0;
    })
    .map((role) => ({
      id: role.id,
      href: `/survey/${slugify(role.role)}`,
      label: role.role,
      current: slugify(role.role) === currentRole,
      completed: hasAnsweredAllQuestionsForRole(
        userAnswersForRole,
        role.id,
        questions,
      ),
      started: userAnswersForRole.some((answer) =>
        answer.question.roles?.some((role) => role.id === role.id),
      ),
    }));

  const screenSize = useScreenSize();

  return (
    <div>
      {screenSize.width < 768 && (
        <div>
          <div className="mb-4">
            <MobileProgressionBar roles={selectedRolesForProgressBar} />
          </div>
          <MobileSurveyQuestionnaire
            session={session}
            questions={questions}
            filteredQuestions={filteredQuestions}
            answerOptions={answerOptions}
            userSelectedRoles={userSelectedRoles}
            userAnswersForRole={userAnswersForRole}
            currentRole={currentRole}
          />
        </div>
      )}
      {screenSize.width >= 768 && (
        <div>
          <ProgressionBar roles={selectedRolesForProgressBar} />
          <SurveyQuestions
            session={session}
            questions={questions}
            filteredQuestions={filteredQuestions}
            answerOptions={answerOptions}
            userSelectedRoles={userSelectedRoles}
            userAnswersForRole={userAnswersForRole}
            currentRole={currentRole}
          />
        </div>
      )}
    </div>
  );
}

export default SurveyQuestionnaire;
