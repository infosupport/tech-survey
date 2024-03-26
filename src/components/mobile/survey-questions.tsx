"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

import { InfoCircledIcon } from "@radix-ui/react-icons";

import { type AnswerOption, type Question, type Section } from "~/models/types";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";

import { type Dispatch, type SetStateAction, useState } from "react";

import { api } from "~/trpc/react";
import { type Session } from "next-auth";
import { idToMoreInfo, idToTextMap } from "~/utils/optionMapping";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  getNextHref,
  handleResponseSelection,
  onSubmit,
} from "~/utils/survey-utils";
import { SpinnerButton } from "../ui/button-spinner";
import { type useForm } from "react-hook-form";

export function MobileSurveyQuestionnaire({
  session,
  filteredQuestions,
  answerOptions,
  form,
  selectedRolesForProgressBar,
  responses,
  setResponses,
}: {
  session: Session;
  filteredQuestions: Question[];
  answerOptions: AnswerOption[];
  form: ReturnType<typeof useForm>;
  selectedRolesForProgressBar: Section[];
  responses: Record<string, string>;
  setResponses: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
            disabled={submitResponse.isLoading}
            name={getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"}
          />
        </form>
      </Form>
    </div>
  );
}
