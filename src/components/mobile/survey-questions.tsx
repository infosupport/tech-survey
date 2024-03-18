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

import { useState } from "react";

import { api } from "~/trpc/react";
import { type Session } from "next-auth";
import { idToTextMap } from "~/utils/optionMapping";

import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import { slugify } from "~/utils/slugify";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  useGenerateFormAndSchema,
  getInitialResponses,
  getNextHref,
  handleResponseSelection,
  hasAnsweredAllQuestionsForRole,
  onSubmit,
} from "~/utils/survey-utils";

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
    getInitialResponses(userAnswersForRole, currentRole),
  );

  const unansweredQuestions = filteredQuestions.filter(
    (question) => !responses[question.id],
  );

  const { form } = useGenerateFormAndSchema(unansweredQuestions, answerOptions);

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
          onSubmit={form.handleSubmit((data) => {
            onSubmit(
              data,
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
          <Button type="submit">
            {getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
