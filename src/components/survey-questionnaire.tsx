"use client";

import {
  type Role,
  type AnswerOption,
  type Question,
  type QuestionResult,
} from "~/models/types";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { type Session } from "next-auth";
import { slugify } from "~/utils/slugify";

import ProgressionBar from "./progression-bar";
import useScreenSize from "./use-screen-size";
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
import renderNotFoundPage from "~/app/[...not_found]/page";
import useOnlineStatus from "./use-online-status";

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

  const { isSubmitting, setIsSubmitting, submitResponse } = useSubmission();

  const [responses, setResponses] = useState(
    getInitialResponses(userAnswersForRole, currentRole, userSelectedRoles),
  );

  const screenSize = useScreenSize();

  const isOnline = useOnlineStatus();

  const [previouslyOffline, setPreviouslyOffline] = useState(false);

  useEffect(() => {
    console.log("isOnline", isOnline);
    const handleOnline = async () => {
      if (previouslyOffline) {
        try {
          await SaveResponsesToDatabase(responses, session, submitResponse);
        } catch (error) {
          console.error("Error in online submission:", error);
        }
        setPreviouslyOffline(false);
      }
    };

    if (!isOnline) {
      setPreviouslyOffline(true);
    } else {
      handleOnline().catch(() => {
        console.log("Failed to save responses");
      });
    }
  }, [isOnline, previouslyOffline, responses, session, submitResponse]);

  useEffect(() => {
    if (isOnline && previouslyOffline) {
      toast({
        title: "Back online!",
        description:
          "Your (intermediate) responses have been submitted successfully.",
      });
    } else if (!isOnline) {
      toast({
        title: "Failed to save responses. Retrying...",
        description:
          "Data submission in progress... Your responses will be automatically submitted once you're back online. Feel free to continue filling out the survey.",
        variant: "informative",
      });
    }
  }, [isOnline, previouslyOffline]);

  if (!roleExists) {
    return renderNotFoundPage();
  }

  // Dynamically generate the slugToId mapping
  const slugToId: Record<string, string> = {};
  userSelectedRoles.forEach((role) => {
    slugToId[slugify(role.role)] = role.id;
  });

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

  const ProgressionBarComponent =
    screenSize.width < 768 ? MobileProgressionBar : ProgressionBar;
  const QuestionsComponent =
    screenSize.width < 768 ? MobileSurveyQuestionnaire : SurveyQuestions;

  return (
    <div>
      <ProgressionBarComponent roles={selectedRolesForProgressBar} />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            async () => {
              setIsSubmitting(true);
              onSubmit(
                form.getValues(),
                session,
                selectedRolesForProgressBar,
                submitResponse,
              ).catch((error) => {
                console.error("Error in form submission:", error);
              });
            },
            (errors) => {
              // scroll to the first error
              const firstError = Object.keys(errors)[0];
              const element = document.getElementById(firstError ?? "");
              element?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });
            },
          )}
          className="grid gap-4 md:grid-cols-1 lg:grid-cols-1"
        >
          <QuestionsComponent
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
            state={isSubmitting || submitResponse.isLoading || !isOnline}
            disabled={isSubmitting || submitResponse.isLoading || !isOnline}
            name={getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"}
          />
        </form>
      </Form>
    </div>
  );
}

export default SurveyQuestionnaire;
