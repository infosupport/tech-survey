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
  type Role,
} from "~/models/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "~/components/ui/use-toast";
import { type Session } from "next-auth";
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

  console.log("HandleResponseSelection responses", responses);
  await SaveResponsesToDatabase(
    { ...responses, [questionId]: answerId },
    session,
    submitResponse,
  );
}

export function GenerateFormAndSchema(
  unansweredQuestions: Question[],
  answerOptions: AnswerOption[],
  formValues: Record<string, any>,
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

export async function SaveResponsesToDatabase(
  responses: Record<string, string>,
  session: Session | null,
  submitResponse: any,
): Promise<boolean> {
  console.log("responses", responses);

  const mappedResponses: SurveyResponse[] = Object.entries(responses).map(
    ([questionId, answerId]) => ({
      userId: session?.user.id,
      questionId,
      answerId,
    }),
  );

  console.log("mappedResponses", mappedResponses);

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await Promise.all([submitResponse.mutateAsync(mappedResponses)]);
    console.log("Responses saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving responses:", error);
    // You might want to handle the error here, e.g., display a toast
    toast({
      title: "Error!",
      description: "Failed to save responses.",
      variant: "destructive",
    });
    return false;
  }

  return false; // Returning false temporarily, as actual result depends on asynchronous operations
}

export async function onSubmit(
  responses: Record<string, string>,
  session: Session | null,
  selectedRolesForProgressBar: ProgressBar[],
  submitResponse: any,
): Promise<void> {
  let responsesSaved = false;
  try {
    responsesSaved = await SaveResponsesToDatabase(
      responses,
      session,
      submitResponse,
    );
  } catch (error) {
    console.error("Error in onSubmit:", error);
  }

  if (responsesSaved) {
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
  } else {
    toast({
      title: "Failed to save responses. Unable to reach the server.",
      description: "Please try again later.",
      variant: "destructive",
    });
  }
}
