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
const MAX_RETRY_INTERVAL = 5000;
const MAX_TOTAL_RETRY_TIME = 30000;

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

  console.log("HandleResponseSelection responses", responses);
  await saveResponsesToDatabase(
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

// send responses to database when back online
export async function saveResponsesToDatabase(
  responses: Record<string, string>,
  session: Session | null,
  submitResponse: any,
): Promise<boolean> {
  console.log("SaveResponsesToDatabase responses", responses);

  const mappedResponses: SurveyResponse[] = Object.entries(responses).map(
    ([questionId, answerId]) => ({
      userId: session?.user.id,
      questionId,
      answerId,
    }),
  );

  const submitWithExponentialBackoff = async () => {
    let retryAttempts = 0;
    let retryInterval = 1000; // Initial retry interval in milliseconds
    let totalRetryTime = 0;

    while (
      retryAttempts < MAX_RETRY_ATTEMPTS &&
      totalRetryTime < MAX_TOTAL_RETRY_TIME
    ) {
      try {
        // Check for network connectivity before attempting to submit data
        if (!navigator.onLine) {
          toast({
            title: "Offline. Waiting for network connection...",
            description:
              "Attempting to submit data... - Your responses will be saved locally and submitted when you are back online.",
            variant: "informative",
          });

          const startTimestamp = performance.now();
          await new Promise<void>((resolve, reject) => {
            const checkConnectivity = () => {
              if (navigator.onLine) {
                resolve();
              } else if (
                performance.now() - startTimestamp >=
                MAX_TOTAL_RETRY_TIME
              ) {
                reject(new Error("Exceeded maximum total retry time"));
              } else {
                setTimeout(checkConnectivity, 1000);
              }
            };
            checkConnectivity();
          }).catch((error) => {
            throw error;
          });
          totalRetryTime += performance.now() - startTimestamp;
        }

        await submitData(mappedResponses, submitResponse);
        return true;
      } catch (error) {
        retryAttempts++;

        toast({
          title: "Failed to save responses. Retrying...",
          description: `Please do not interact with the page - Attempt ${retryAttempts} of ${MAX_RETRY_ATTEMPTS}`,
          variant: "informative",
        });

        retryInterval = Math.min(retryInterval * 2, MAX_RETRY_INTERVAL);
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }

    toast({
      title: "Failed to save responses after multiple attempts.",
      description:
        "Please try again later. Your responses have been saved locally.",
      variant: "destructive",
    });
    return false;
  };

  return submitWithExponentialBackoff();
}

async function submitData(
  mappedResponses: SurveyResponse[],
  submitResponse: any,
) {
  // Batch all responses and wait for all mutations to complete
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await Promise.all([submitResponse.mutateAsync(mappedResponses)]);
}

export async function onSubmit(
  responses: Record<string, string>,
  session: Session | null,
  selectedRolesForProgressBar: ProgressBar[],
  submitResponse: any,
): Promise<void> {
  let responsesSaved = false;

  try {
    responsesSaved = await saveResponsesToDatabase(
      responses,
      session,
      submitResponse,
    );
  } catch (error) {
    console.error("Error in onSubmit:", error);
  }

  if (responsesSaved) {
    console.log("got responsesSaved", responsesSaved);
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
    // Handle case where responses couldn't be saved after multiple attempts
    toast({
      title: "Failed to save responses after multiple attempts.",
      description:
        "Please try again later. Your responses have been saved locally.",
      variant: "destructive",
    });
  }
}
