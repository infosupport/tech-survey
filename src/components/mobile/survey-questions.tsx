"use client";

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
import { idToTextMap } from "~/utils/optionMapping";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { slugify } from "~/utils/slugify";

import {
  getInitialResponses,
  getNextHref,
  handleResponseSelection,
  hasAnsweredAllQuestionsForRole,
  onSubmit,
  GenerateFormAndSchema,
} from "~/utils/survey-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SpinnerButton } from "../button-spinner";

// Function to retrieve data from local storage
const loadResponsesFromLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    const savedResponses = localStorage.getItem(key);
    return savedResponses
      ? (JSON.parse(savedResponses) as Record<string, string>)
      : {};
  }
  return {};
};

// Function to save data to local storage
const saveResponsesToLocalStorage = (
  key: string,
  responses: Record<string, string>,
) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(responses));
  }
};

export const MobileSurveyQuestions = ({
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
}) => {
  const storageKey = "surveyResponses";

  // Initialize state from local storage or default values
  const [responses, setResponses] = useState(() => {
    const fromLocalStorage = loadResponsesFromLocalStorage(storageKey);
    const fromInitial = getInitialResponses(userAnswersForRole, currentRole);

    // Check if both responses exist
    if (fromLocalStorage && fromInitial) {
      // Select the one with greater length
      return (fromLocalStorage?.length ?? 0) > (fromInitial?.length ?? 0)
        ? fromLocalStorage
        : fromInitial;
    } else {
      // If one of them is null or undefined, return the one that exists
      return fromInitial || fromLocalStorage;
    }
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Save responses to local storage whenever it updates
  useEffect(() => {
    saveResponsesToLocalStorage(storageKey, responses);
  }, [responses]);

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

  const unansweredQuestions = filteredQuestions.filter(
    (question) =>
      !userAnswersForRole.some((answer) => answer.question.id === question.id),
  );

  const { form } = GenerateFormAndSchema(
    unansweredQuestions,
    answerOptions,
    responses,
  );

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

  const handleSubmit = form.handleSubmit(async () => {
    setIsSubmitting(true);
    onSubmit(
      form.getValues(),
      session,
      selectedRolesForProgressBar,
      submitResponse,
    ).catch((error) => {
      console.error("Error in form submission:", error);
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
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
                              <span className="text-gray-900 dark:text-white">
                                {idToTextMap[option.option]}
                              </span>
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
  );
};
