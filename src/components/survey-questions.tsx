"use client";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";

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
import { idToMoreInfo, idToTextMap } from "~/utils/optionMapping";

import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { slugify } from "~/utils/slugify";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  getInitialResponses,
  getNextHref,
  handleResponseSelection,
  hasAnsweredAllQuestionsForRole,
  onSubmit,
  useGenerateFormAndSchema,
} from "~/utils/survey-utils";
import { InfoCircledIcon } from "@radix-ui/react-icons";

export function SurveyQuestions({
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
    (question) => !responses[question.id],
  );

  const { form } = useGenerateFormAndSchema(unansweredQuestions, answerOptions);

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
                    className={
                      form.formState.errors[question.id]
                        ? "!border-2 !border-dashed !border-red-500"
                        : ""
                    }
                  >
                    {/* add a dashed border of 1px in color red in case of validation error */}
                    <TableCell>
                      {question.questionText}
                      <FormMessage />
                    </TableCell>
                    {answerOptions.map((option) => (
                      <TableCell
                        key={option.id}
                        className={`${field.value === option.id || responses[question.id] === option.id ? "rounded-lg bg-custom-selectedLight dark:bg-custom-selected" : ""} w-[300px]`}
                      >
                        <FormItem>
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
                              <label className="flex cursor-pointer items-center justify-center">
                                <FormControl>
                                  <RadioGroupItem
                                    value={option.id}
                                    checked={
                                      field.value === option.id ||
                                      responses[question.id] === option.id
                                    }
                                  />
                                </FormControl>
                              </label>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              />
            ))}
          </TableBody>
        </Table>
        <Button type="submit">
          {getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
