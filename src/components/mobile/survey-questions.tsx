"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

import { InfoCircledIcon } from "@radix-ui/react-icons";

import {
  type AnswerOption,
  type Question,
  type SurveyResponse,
} from "~/models/types";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";

import { type Session } from "next-auth";
import { idToMoreInfo, idToTextMap } from "~/utils/optionMapping";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type useForm } from "react-hook-form";
import { findAnswerId } from "~/utils/survey-utils";

export function MobileSurveyQuestionnaire({
  session,
  filteredQuestions,
  answerOptions,
  form,
  saveAnswer,
  currentAnswers,
}: {
  session: Session;
  filteredQuestions: Question[];
  answerOptions: AnswerOption[];
  form: ReturnType<typeof useForm>;
  saveAnswer: (answer: SurveyResponse) => void;
  currentAnswers: SurveyResponse[];
}) {
  return (
    <div>
      {filteredQuestions?.map((question) => (
        <div key={question.id} className="mx-auto w-full">
          <FormField
            control={form.control}
            name={question.id}
            key={`${question.id}`}
            render={({ field }) => (
              <Card
                id={question.id}
                className={`mt-4 border-2 ${form.formState.errors[question.id] ? "border-red-500" : "border-gray-200 dark:border-slate-900"}`}
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
                            saveAnswer({
                              userId: session.user.id,
                              questionId: question.id,
                              answerId: value,
                            });
                          }}
                          value={field.value as string}
                          className="flex flex-col space-y-1"
                        >
                          <label
                            className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 ${
                              field.value === option.id ||
                              findAnswerId(currentAnswers, question.id) ===
                                option.id
                                ? "bg-custom-selectedLight dark:bg-custom-selected"
                                : "hover:bg-gray-100 dark:hover:bg-slate-900"
                            }`}
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={option.id}
                                checked={
                                  field.value === option.id ||
                                  findAnswerId(currentAnswers, question.id) ===
                                    option.id
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
    </div>
  );
}
