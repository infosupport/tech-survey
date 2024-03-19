/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { z } from "zod";
import {
  type UserAnswer,
  type Question,
  type QuestionResult,
  type ProgressBar,
  type HandleResponseSelectionParams,
  type AnswerOption,
  type SurveyResponse,
  type QuestionSchema,
} from "~/models/types";
import { slugToId } from "~/utils/slugify";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "~/components/ui/use-toast";
import { type Session } from "next-auth";

const MAX_RETRY_ATTEMPTS = 5;

export function getInitialResponses(
  userAnswersForRole: UserAnswer[],
  currentRole: string,
): Record<string, string> {
  const initialResponses: Record<string, string> = {};
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

export async function handleResponseSelection({
  questionId,
  answerId,
  responses,
  setResponses,
  session,
  submitResponse,
}: HandleResponseSelectionParams) {
  setResponses((prevResponses) => ({
    ...prevResponses,
    [questionId]: answerId,
  }));

  console.log("responses", responses);
  await saveResponsesToDatabase(responses, session, submitResponse);
}

export function useGenerateFormAndSchema(
  unansweredQuestions: Question[],
  answerOptions: AnswerOption[],
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
  });

  return { form, FormSchema };
}

export async function saveResponsesToDatabase(
  responses: Record<string, string>,
  session: Session | null,
  submitResponse: any,
): Promise<void> {
  console.log("responses", responses);

  const mappedResponses: SurveyResponse[] = Object.entries(responses).map(
    ([questionId, answerId]) => ({
      userId: session?.user.id,
      questionId,
      answerId,
    }),
  );

  console.log("mappedResponses", mappedResponses);

  let retryAttempts = 0;

  while (retryAttempts < MAX_RETRY_ATTEMPTS) {
    try {
      await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        mappedResponses.map((response) => submitResponse.mutateAsync(response)),
      );
      console.log("Responses saved successfully");
      return;
    } catch (error) {
      console.error("Error saving responses:", error);
      retryAttempts++;

      // Calculate the wait time using exponential backoff
      const waitTime = Math.pow(2, retryAttempts) * 1000;

      // Inform the user that the responses are being retried.
      toast({
        title: "Failed to save responses. Retrying...",
        description: `Please do not interact with the page - Attempt ${retryAttempts} of ${MAX_RETRY_ATTEMPTS}`,
        variant: "informative",
      });

      // Wait for the calculated duration before retrying
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // If all retry attempts fail, display an error toast
  toast({
    title: "Failed to save responses after multiple attempts.",
    description:
      "Please try again later. Your responses have been saved locally.",
    variant: "destructive",
  });
}

export async function onSubmit(
  responses: Record<string, string>,
  session: Session | null,
  selectedRolesForProgressBar: ProgressBar[],
  submitResponse: any,
): Promise<void> {
  try {
    await saveResponsesToDatabase(responses, session, submitResponse);
    const nextHref = getNextHref(selectedRolesForProgressBar);
    if (nextHref) {
      window.location.assign(nextHref);
    } else {
      toast({
        title: "Success!",
        description: "Your survey has been submitted.",
      });
      // wait for 2 seconds before redirecting to the thank you page
      setTimeout(() => {
        window.location.assign("/thank-you");
      }, 2000);
    }
  } catch (error) {
    console.error("Error in onSubmit:", error);
  }
}
