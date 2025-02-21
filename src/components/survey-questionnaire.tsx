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
    useGenerateFormAndSchema,
    getInitialResponses,
    getNextHref,
} from "~/utils/survey-utils";
import { toast } from "./ui/use-toast";
import { useSubmitAnswers } from "~/utils/submission-utils";
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

    const [responses] = useState(
        getInitialResponses(userAnswersForRole, currentRole, userSelectedRoles),
    );

    const { saveAnswer, isSubmitting, currentAnswers } = useSubmitAnswers();

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

    const unansweredQuestions = filteredQuestions.filter(
        (question) =>
            !userAnswersForRole.some(
                (answer) => answer.question.id === question.id,
            ),
    );

    const { form } = useGenerateFormAndSchema(
        unansweredQuestions,
        answerOptions,
        responses,
    );

    const screenSize = useScreenSize();

    const onlineStatus = useOnlineStatus();

    useEffect(() => {
        if (onlineStatus === "isBackOnline") {
            toast({
                title: "Back online!",
                description:
                    "Your (intermediate) responses have been submitted successfully.",
            });
        } else if (onlineStatus === "isOffline") {
            toast({
                title: "Failed to save responses. Retrying...",
                description:
                    "Data submission in progress... Your responses will be automatically submitted once you're back online. Feel free to continue filling out the survey.",
                variant: "informative",
            });
        }
    }, [onlineStatus]);

    if (!roleExists) {
        return renderNotFoundPage();
    }

    // function that check if a user already has more than 1 response for a question
    function hasAnsweredAllQuestionsForRole(
        currentAnswers: QuestionResult[],
        roleId: string,
        questions: Question[],
    ) {
        const totalQuestionsForRole = questions
            .filter((question) => question.roleIds?.includes(roleId))
            .map((question) => question.id);

        // Get unique question IDs from totalQuestionsForRole
        const uniqueQuestionIds = new Set(totalQuestionsForRole);

        // Filter currentAnswersForRole to remove duplicates
        const currentAnswersForRole = currentAnswers.filter(
            (answer, index, self) =>
                self.findIndex((a) => a.question.id === answer.question.id) ===
                    index && uniqueQuestionIds.has(answer.question.id),
        );

        const answeredQuestionsForRole = currentAnswersForRole.filter(
            (answer) => answer.answerId !== undefined,
        );

        return answeredQuestionsForRole.length >= totalQuestionsForRole.length;
    }

    function hasAnsweredAllQuestionsForCurrentRole(
        form: ReturnType<typeof useGenerateFormAndSchema>["form"],
    ) {
        const formValues = form.getValues();

        // count the number of undefined values in the form
        const unansweredQuestions = Object.values(formValues).filter(
            (value) => value === undefined,
        );

        return unansweredQuestions.length === 0;
    }

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
            currentCompleted: hasAnsweredAllQuestionsForCurrentRole(form),
        }));

    const ProgressionBarComponent =
        screenSize.width < 768 ? MobileProgressionBar : ProgressionBar;
    const QuestionsComponent =
        screenSize.width < 768 ? MobileSurveyQuestionnaire : SurveyQuestions;

    function handleButtonClick(
        event: React.MouseEvent<HTMLButtonElement>,
    ): void {
        // Check if the form is currently valid or all questions have been answered
        if (!hasAnsweredAllQuestionsForCurrentRole(form)) {
            // Form is not valid, do not proceed to the next page
            return;
        }

        if (getNextHref(selectedRolesForProgressBar)) {
            event.preventDefault();
            const nextHref = getNextHref(selectedRolesForProgressBar);
            if (nextHref) {
                window.location.href = nextHref;
            }
        } else {
            window.location.href = "/thank-you";
        }
    }

    return (
        <div>
            <ProgressionBarComponent roles={selectedRolesForProgressBar} />
            <h2 className="mb-4 mt-4 text-2xl font-bold">
                {userSelectedRoles.find(
                    (role) => slugify(role.role) === currentRole,
                )?.role ?? ""}{" "}
                questions
            </h2>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(
                        async () => {
                            // Do nothing
                        },
                        (errors) => {
                            // scroll to the first error
                            const firstError = Object.keys(errors)[0];
                            const element = document.getElementById(
                                firstError ?? "",
                            );
                            element?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                                inline: "center",
                            });
                        },
                    )}
                    className="grid justify-items-end gap-4 md:grid-cols-1 lg:grid-cols-1"
                >
                    <QuestionsComponent
                        session={session}
                        filteredQuestions={filteredQuestions}
                        answerOptions={answerOptions}
                        form={form}
                        saveAnswer={saveAnswer}
                        currentAnswers={currentAnswers}
                    />
                    <SpinnerButton
                        type="submit"
                        state={isSubmitting || onlineStatus === "isOffline"}
                        disabled={isSubmitting || onlineStatus === "isOffline"}
                        name={
                            getNextHref(selectedRolesForProgressBar)
                                ? "Next"
                                : "Submit"
                        }
                        onClick={handleButtonClick}
                    />
                </form>
            </Form>
        </div>
    );
}

export default SurveyQuestionnaire;
