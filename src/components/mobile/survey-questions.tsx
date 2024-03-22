"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

import { InfoCircledIcon } from "@radix-ui/react-icons";

import {
  type Role,
  type AnswerOption,
  type Question,
  type QuestionResult,
} from "~/models/types";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";

import { useEffect, useState } from "react";

import { api } from "~/trpc/react";
import { type Session } from "next-auth";
import { idToMoreInfo, idToTextMap } from "~/utils/optionMapping";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import { slugify } from "~/utils/slugify";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  GenerateFormAndSchema,
  getInitialResponses,
  getNextHref,
  handleResponseSelection,
  hasAnsweredAllQuestionsForRole,
  onSubmit,
  SaveResponsesToDatabase,
} from "~/utils/survey-utils";
import { SpinnerButton } from "../ui/button-spinner";
import { toast } from "../ui/use-toast";

export function MobileSurveyQuestionnaire({
  session,
  questions,
  filteredQuestions,
  answerOptions,
  userSelectedRoles,
  userAnswersForRole,
  currentRole,
}: {
  session: Session;
  questions: Question[];
  filteredQuestions: Question[];
  answerOptions: AnswerOption[];
  userSelectedRoles: Role[];
  userAnswersForRole: QuestionResult[];
  currentRole: string;
}) {
  const [responses, setResponses] = useState(
    getInitialResponses(userAnswersForRole, currentRole, userSelectedRoles),
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const unansweredQuestions = filteredQuestions.filter(
    (question) =>
      !userAnswersForRole.some((answer) => answer.question.id === question.id),
  );

  const { form } = GenerateFormAndSchema(
    unansweredQuestions,
    answerOptions,
    responses,
  );

  const submitResponse = api.survey.setQuestionResult.useMutation({
    onSuccess: () => {
      console.log("Response submitted successfully");
      return true;
    },
    onError: (error) => {
      console.error("Error submitting response:", error);
      return false;
    },
  });

  useEffect(() => {
    let PreviouslyOffline = false;
    const handleOnline = async () => {
      if (PreviouslyOffline) {
        try {
          await SaveResponsesToDatabase(responses, session, submitResponse);
          toast({
            title: "Back online!",
            description:
              "Your (intermediate) responses have been submitted successfully.",
          });
        } catch (error) {
          toast({
            title: "Failed to resend responses",
            description:
              "An error occurred while attempting to resend responses.",
            variant: "destructive",
          });
        }
        PreviouslyOffline = false;
      }
    };

    const handleOffline = () => {
      PreviouslyOffline = true;
      console.log("Offline - Failed to save responses. Retrying...");
      // Display error toast if offline
      toast({
        title: "Failed to save responses. Retrying...",
        description:
          "Data submission in progress... Your responses will be automatically submitted once you're back online. Feel free to continue filling out the survey.",
        variant: "informative",
      });
    };
    if (!navigator.onLine) {
      // Handle offline when component mounts
      handleOffline();
    } else {
      handleOnline().catch(() => {
        toast({
          title: "Failed to resend responses",
          description:
            "An error occurred while attempting to resend responses.",
          variant: "destructive",
        });
      });
    }

    // Add event listeners for online and offline events
    window.addEventListener("online", () => {
      handleOnline().catch(() => {
        toast({
          title: "Failed to resend responses",
          description:
            "An error occurred while attempting to resend responses.",
          variant: "destructive",
        });
      });
    });
    window.addEventListener("offline", handleOffline);

    return () => {
      // Remove event listeners when component unmounts
      window.addEventListener("online", () => {
        handleOnline().catch(() => {
          toast({
            title: "Failed to resend responses",
            description:
              "An error occurred while attempting to resend responses.",
            variant: "destructive",
          });
        });
      });
      window.removeEventListener("offline", handleOffline);
    };
  }, [responses, session, submitResponse]);

  const handleSelection = async (
    questionId: string,
    answerId: string,
  ): Promise<void> => {
    await handleResponseSelection({
      questionId,
      answerId,
      responses,
      setResponses,
      session,
      submitResponse,
    });
  };

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
    }));

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async () => {
            setIsSubmitting(true);
            onSubmit(
              form.getValues(),
              session,
              selectedRolesForProgressBar,
              submitResponse,
            ).catch((error) => {
              console.error("Error in form submission:", error);
            });
          })}
          className="grid gap-4 md:grid-cols-1 lg:grid-cols-1"
        >
          {filteredQuestions?.map((question) => (
            <div key={question.id} className="mx-auto w-full">
              <FormField
                control={form.control}
                name={question.id}
                key={`${question.id}`}
                render={({ field }) => (
                  <Card
                    className={`border-2 ${form.formState.errors[question.id] ? "border-red-500" : "border-gray-200 dark:border-slate-900"}`}
                  >
                    <CardHeader>
                      <CardTitle>
                        {question.questionText}
                        <FormMessage />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {answerOptions.map((option) => (
                        <FormItem key={option.id}>
                          <FormControl>
                            <RadioGroup
                              onValueChange={async (value) => {
                                field.onChange(value);
                                try {
                                  await handleSelection(question.id, value);
                                } catch (error) {
                                  console.error(
                                    "Error in handleResponseSelection:",
                                    error,
                                  );
                                }
                              }}
                              value={field.value as string}
                              className="flex flex-col space-y-1"
                            >
                              <label
                                className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 ${field.value === option.id || responses[question.id] === option.id ? "bg-custom-selectedLight dark:bg-custom-selected" : "hover:bg-gray-100 dark:hover:bg-slate-900"}`}
                              >
                                <FormControl>
                                  <RadioGroupItem
                                    value={option.id}
                                    checked={
                                      field.value === option.id ||
                                      responses[question.id] === option.id
                                    }
                                  />
                                </FormControl>
                                <div className="flex items-center">
                                  <span className="text-gray-900 dark:text-white">
                                    {idToTextMap[option.option]}
                                  </span>

                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <div className="ml-2">
                                        <InfoCircledIcon />
                                      </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80">
                                      <div className="flex justify-between space-x-4">
                                        <div className="space-y-1">
                                          <p className="text-sm font-normal">
                                            {idToMoreInfo[option.option]}
                                          </p>
                                        </div>
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                </div>
                              </label>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      ))}
                    </CardContent>
                  </Card>
                )}
              />
            </div>
          ))}
          <SpinnerButton
            type="submit"
            state={isSubmitting}
            name={getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"}
          />
        </form>
      </Form>
    </div>
  );
}
