"use client";

import {
  type Role,
  type AnswerOption,
  type Question,
  type QuestionResult,
} from "~/models/types";
import { usePathname, notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { type Session } from "next-auth";
import { slugify } from "~/utils/slugify";

import ProgressionBar from "./progression-bar";
import useScreenSize from "./useScreenSize";
import { MobileSurveyQuestionnaire } from "./mobile/survey-questions";
import { SurveyQuestions } from "./survey-questions";
import { MobileProgressionBar } from "./mobile/progression-bar";
import {
  GenerateFormAndSchema,
  getInitialResponses,
  getNextHref,
  SaveResponsesToDatabase,
  onSubmit,
} from "~/utils/survey-utils";
import { toast } from "./ui/use-toast";
import { useSubmission } from "~/utils/submission-utils";
import { SpinnerButton } from "./ui/button-spinner";
import { Form } from "./ui/form";

export function SurveyQuestionnaire({
  session,
  questions,
  answerOptions,
  userSelectedRoles,
  userAnswersForRole,
}: {
  session: Session;
  questions: Question[];
  answerOptions: AnswerOption[];
  userSelectedRoles: Role[];
  userAnswersForRole: QuestionResult[];
}) {
  const [selectedRoles] = useState<string[]>(
    userSelectedRoles.map((role) => role.id),
  );
  const pathname = usePathname() || "";

  // get the current role from the url, which is /survey/[role]
  const currentRole = pathname.split("/").pop() ?? "";

  const roleExists = userSelectedRoles.some(
    (role) => slugify(role.role) === currentRole,
  );

  if (!roleExists) {
    notFound();
  }

  // Dynamically generate the slugToId mapping
  const slugToId: Record<string, string> = {};
  userSelectedRoles.forEach((role) => {
    slugToId[slugify(role.role)] = role.id;
  });

  const { isSubmitting, setIsSubmitting, submitResponse } = useSubmission();

  const [responses, setResponses] = useState(
    getInitialResponses(userAnswersForRole, currentRole, userSelectedRoles),
  );

  const filteredQuestions = questions.filter(
    (question) =>
      question.roleIds?.some(
        (roleId) => roleId === slugToId[currentRole ?? ""],
      ) && selectedRoles.includes(slugToId[currentRole ?? ""] ?? ""),
  );

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

  const screenSize = useScreenSize();

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

  const unansweredQuestions = filteredQuestions.filter(
    (question) =>
      !userAnswersForRole.some((answer) => answer.question.id === question.id),
  );

  const { form } = GenerateFormAndSchema(
    unansweredQuestions,
    answerOptions,
    responses,
  );

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
      started: userAnswersForRole.some((answer) =>
        answer.question.roles?.some((role) => role.id === role.id),
      ),
    }));

  return (
    <div>
      {screenSize.width < 768 && (
        <div>
          <div className="mb-4">
            <MobileProgressionBar roles={selectedRolesForProgressBar} />
          </div>
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
              <MobileSurveyQuestionnaire
                session={session}
                filteredQuestions={filteredQuestions}
                answerOptions={answerOptions}
                form={form}
                responses={responses}
                setResponses={setResponses}
                submitResponse={submitResponse}
              />
              <SpinnerButton
                type="submit"
                state={isSubmitting || submitResponse.isLoading}
                disabled={isSubmitting || submitResponse.isLoading}
                name={
                  getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"
                }
              />
            </form>
          </Form>
        </div>
      )}
      {screenSize.width >= 768 && (
        <div>
          <ProgressionBar roles={selectedRolesForProgressBar} />
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
              <SurveyQuestions
                session={session}
                filteredQuestions={filteredQuestions}
                answerOptions={answerOptions}
                form={form}
                responses={responses}
                setResponses={setResponses}
                submitResponse={submitResponse}
              />
              <SpinnerButton
                type="submit"
                state={isSubmitting || submitResponse.isLoading}
                disabled={isSubmitting || submitResponse.isLoading}
                name={
                  getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"
                }
              />
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}

export default SurveyQuestionnaire;
