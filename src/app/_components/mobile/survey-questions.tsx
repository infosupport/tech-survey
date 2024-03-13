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

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { toast } from "~/components/ui/use-toast";
import { slugToId, slugify } from "~/utils/slugify";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

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
  const [responses, setResponses] = useState<Record<string, string>>({});
  type InitialResponses = Record<string, string>;

  useEffect(() => {
    // Populate responses with previous answers for the current role when component mounts
    const initialResponses: InitialResponses = {};
    userAnswersForRole.forEach((answer) => {
      if (
        answer.question.roles?.some((role) => role.id === slugToId[currentRole])
      ) {
        initialResponses[answer.question.id] = answer.answerId;
      }
    });
    setResponses(initialResponses);
  }, [userAnswersForRole, currentRole]);

  // function that check if a user already has more than 1 response for a question
  function hasAnsweredAllQuestionsForRole(
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

  const unansweredQuestions = filteredQuestions.filter(
    (question) => !responses[question.id],
  );

  const handleResponseSelection = async (
    questionId: string,
    answerId: string,
  ) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [questionId]: answerId,
    }));

    console.log("responses", responses);
    await saveResponsesToDatabase();
  };

  type QuestionSchema = Record<string, z.ZodEnum<[string, ...string[]]>>;

  // look at the responses to create validation schema
  const FormSchema = z.object(
    unansweredQuestions.reduce<QuestionSchema>((schema, question) => {
      // Add a validation rule for each question ID
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

  async function saveResponsesToDatabase() {
    console.log("responses", responses);

    const mappedResponses = Object.entries(responses).map(
      ([questionId, answerId]) => ({
        userId: session?.user.id,
        questionId,
        answerId,
      }),
    );

    console.log("mappedResponses", mappedResponses);

    try {
      // Submitting responses for each question
      await Promise.all(
        mappedResponses.map((response) => submitResponse.mutateAsync(response)),
      );
      console.log("Responses saved successfully");
    } catch (error) {
      console.error("Error saving responses:", error);
      // You might want to handle the error here, e.g., display a toast
      toast({
        title: "Error!",
        description: "Failed to save responses.",
        variant: "destructive",
      });
    }
  }

  async function onSubmit() {
    try {
      await saveResponsesToDatabase();
      const nextHref = getNextHref();
      if (nextHref) {
        window.location.assign(nextHref);
      } else {
        toast({
          title: "Success!",
          description: "Your survey has been submitted.",
        });
        // wait for 2 seconds before redirecting to the thank you page
        setTimeout(() => {
          window.location.assign("/survey/thank-you");
        }, 2000);
      }
    } catch (error) {
      console.error("Error in onSubmit:", error);
    }
  }

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

  function getNextHref() {
    // lookup the current index of the current role
    const index = selectedRolesForProgressBar.findIndex(
      (role) => role.current === true,
    );
    return selectedRolesForProgressBar[index + 1]?.href;
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 md:grid-cols-1 lg:grid-cols-1"
        >
          {filteredQuestions?.map((question) => (
            <div key={question.id} className="mx-auto w-full">
              <FormField
                control={form.control}
                name={question.id}
                key={`${question.id}`}
                render={({ field }) => (
                  <Card>
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
                                  await handleResponseSelection(
                                    question.id,
                                    value,
                                  );
                                } catch (error) {
                                  console.error(
                                    "Error in handleResponseSelection:",
                                    error,
                                  );
                                }
                              }}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <label className="flex cursor-pointer items-center space-x-2 rounded-lg p-2 hover:bg-gray-100">
                                <FormControl>
                                  <RadioGroupItem
                                    value={option.id}
                                    checked={
                                      field.value === option.id ||
                                      responses[question.id] === option.id
                                    }
                                  />
                                </FormControl>
                                <span className=":dark:text-white-100 text-gray-900">
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
          <Button type="submit">{getNextHref() ? "Next" : "Submit"}</Button>
        </form>
      </Form>
    </div>
  );
}
