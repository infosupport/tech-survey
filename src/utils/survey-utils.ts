"use client";

import { z } from "zod";
import {
  type UserAnswer,
  type Question,
  type QuestionResult,
  type ProgressBar,
  type AnswerOption,
  type SurveyResponse,
  type QuestionSchema,
  type Role,
} from "~/models/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { slugify } from "./slugify";

export function getInitialResponses(
  userAnswersForRole: UserAnswer[],
  currentRole: string,
  userSelectedRoles: Role[],
): Record<string, string> {
  const initialResponses: Record<string, string> = {};
  // Dynamically generate the slugToId mapping
  const slugToId: Record<string, string> = {};
  userSelectedRoles.forEach((role) => {
    slugToId[slugify(role.role)] = role.id;
  });

  userAnswersForRole.forEach((answer) => {
    if (
      answer.question.roles?.some((role) => role.id === slugToId[currentRole])
    ) {
      initialResponses[answer.question.id] = answer.answerId;
    }
  });
  return initialResponses;
}

export function getNextHref(
  selectedRolesForProgressBar: ProgressBar[],
): string | undefined {
  const index = selectedRolesForProgressBar.findIndex(
    (role) => role.current === true,
  );
  return selectedRolesForProgressBar[index + 1]?.href;
}

export function progressionInfo(
  roles: { label: string; current: boolean; completed: boolean }[],
) {
  const currentRoleIndex = roles.findIndex((role) => role.current === true);
  const completedRoles = roles.filter((role) => role.completed === true).length;
  const totalRoles = roles.length;
  const currentRole = roles[currentRoleIndex];
  const progressPercentage = (completedRoles / totalRoles) * 100;

  return {
    completedRoles,
    totalRoles,
    currentRole,
    progressPercentage,
  };
}

export function hasAnsweredAllQuestionsForRole(
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

export function useGenerateFormAndSchema(
  unansweredQuestions: Question[],
  answerOptions: AnswerOption[],
  formValues: Record<string, string>,
): {
  form: ReturnType<typeof useForm>;
  FormSchema: z.ZodObject<QuestionSchema>;
} {
  const FormSchema: z.ZodObject<QuestionSchema> = z.object(
    unansweredQuestions.reduce<QuestionSchema>((schema, question) => {
      return {
        ...schema,
        [question.id]: z.enum(
          [question.id, ...answerOptions.map((option) => option.id)],
          {
            required_error: `You need to select an answer`,
          },
        ),
      };
    }, {}),
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: formValues,
  });

  return { form, FormSchema };
}

export const findAnswerId = (
  currentAnswers: SurveyResponse[],
  questionId: string,
): string | undefined => {
  const response = currentAnswers.find(
    (response) => response.questionId === questionId,
  );
  return response?.answerId;
};
