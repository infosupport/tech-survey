"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

import { type AnswerOption, type Question } from "~/models/types";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";

import { type Session } from "next-auth";
import { idToMoreInfo, idToTextMap } from "~/utils/optionMapping";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { HandleResponseSelection } from "~/utils/survey-utils";
import { type Dispatch, type SetStateAction } from "react";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { type useForm } from "react-hook-form";

export function SurveyQuestions({
  session,
  filteredQuestions,
  answerOptions,
  form,
  responses,
  setResponses,
  submitResponse,
}: {
  session: Session;
  filteredQuestions: Question[];
  answerOptions: AnswerOption[];
  form: ReturnType<typeof useForm>;
  responses: Record<string, string>;
  setResponses: Dispatch<SetStateAction<Record<string, string>>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitResponse: any;
}) {
  return (
    <Table divClassname="">
      <TableHeader className="sticky top-0 z-10 h-10 w-full bg-slate-100 dark:bg-slate-900">
        <TableRow>
          <TableHead className="w-[400px]">Question</TableHead>
          {answerOptions.map((option) => (
            <TableHead className="text-center" key={option.id}>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center">
                    <span style={{ flex: 1, textAlign: "center" }}>
                      {idToTextMap[option.option]}
                    </span>
                    <InfoCircledIcon className="ml-2 h-4 w-4" />
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
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredQuestions?.map((question) => (
          <FormField
            control={form.control}
            name={question.id}
            key={`${question.id}`}
            render={({ field }) => (
              <TableRow
                key={question.id}
                id={question.id}
                className={
                  form.formState.errors[question.id]
                    ? "error !border-2 !border-dashed !border-red-500"
                    : ""
                }
              >
                {/* add a dashed border of 1px in color red in case of validation error */}
                <TableCell>
                  {question.questionText}
                  <FormMessage />
                </TableCell>
                {answerOptions.map((option) => (
                  <TableCell key={option.id} className="w-[300px]">
                    {/* add a dashed border of 1px in color red in case of validation error */}
                    <label
                      className={`${
                        field.value === option.id ||
                        responses[question.id] === option.id
                          ? "rounded-lg border-2 border-custom-selected "
                          : ""
                      }flex h-[40px] cursor-pointer items-center justify-center`}
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={async (value) => {
                              field.onChange(value);
                              try {
                                await HandleResponseSelection({
                                  questionId: question.id,
                                  answerId: value,
                                  responses,
                                  setResponses,
                                  session,
                                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                                  submitResponse,
                                });
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
                            <FormControl>
                              <RadioGroupItem
                                value={option.id}
                                checked={
                                  field.value === option.id ||
                                  responses[question.id] === option.id
                                }
                              />
                            </FormControl>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    </label>
                  </TableCell>
                ))}
              </TableRow>
            )}
          />
        ))}
      </TableBody>
    </Table>
  );
}
