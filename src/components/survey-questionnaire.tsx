"use client";

import {
    type Role,
    type AnswerOption,
    type Question,
    type QuestionResult,
} from "~/models/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { slugify } from "~/utils/slugify";

import ProgressionBar from "./progression-bar";
import useScreenSize from "./use-screen-size";
import { MobileSurveyQuestionnaire } from "./mobile/survey-questions";
import { SurveyQuestions } from "./survey-questions";
import { MobileProgressionBar } from "./mobile/progression-bar";
import { useGenerateFormAndSchema, getNextHref } from "~/utils/survey-utils";
import { toast } from "./ui/use-toast";
import { useSubmitAnswers } from "~/utils/submission-utils";
import { SpinnerButton } from "./ui/button-spinner";
import { Form } from "./ui/form";
import renderNotFoundPage from "~/app/[...not_found]/page";
import useOnlineStatus from "./use-online-status";
import { api } from "~/trpc/react";

export function SurveyQuestionnaire({
    userId,
    questions,
    answerOptions,
    userRoles,
    userAnswersForRole,
}: {
    userId: string;
    questions: Question[];
    answerOptions: AnswerOption[];
    userRoles: Role[];
    userAnswersForRole: QuestionResult[];
}) {
    const pathname = usePathname() || "";
    const router = useRouter();

    // get the current role from the url, which is /survey/[role]
    const currentRole = decodeURIComponent(
        pathname.split("/").pop() ?? "",
    ).toLowerCase();

    const roleExists = userRoles.some(
        (role) => role.role.toLowerCase() === currentRole.toLowerCase(),
    );

    const currentRoleId = userRoles.find(
        (role) => role.role.toLowerCase() === currentRole,
    )?.id;

    const { data, isPending } =
        api.survey.getSurveyQuestionsCompletedPerRole.useQuery(
            { userId: userId },
            { enabled: !!userId },
        );

    const [percentCompletedPerRole, setPercentCompletedPerRole] =
        useState(data);

    useEffect(() => {
        if (!isPending) {
            setPercentCompletedPerRole(data);
        }
    }, [data, isPending]);

    const [responses] = useState(userAnswersForRole);

    const { saveAnswer, isSubmitting, amountOfAnsweredQuestions } =
        useSubmitAnswers(userAnswersForRole);

    useEffect(() => {
        if (currentRoleId) {
            setPercentCompletedPerRole((prevState) => {
                if (!prevState) return prevState;
                const updatedState = { ...prevState };
                if (updatedState[currentRoleId]) {
                    updatedState[currentRoleId].answeredQuestions =
                        amountOfAnsweredQuestions;
                }
                return updatedState;
            });
        }
    }, [amountOfAnsweredQuestions, currentRoleId]);

    const unansweredQuestions = questions.filter(
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

    const selectedRolesForProgressBar = userRoles
        .sort((a, b) => {
            const roleA = a.role.toLowerCase();
            const roleB = b.role.toLowerCase();

            if (roleA === "general") return -1;
            if (roleB === "general") return 1;

            return 0;
        })
        .map((role) => {
            const { totalQuestions, answeredQuestions } =
                percentCompletedPerRole?.[role.id] ?? {
                    totalQuestions: 0,
                    answeredQuestions: 0,
                };

            return {
                id: role.id,
                href: `/survey/${encodeURIComponent(role.role)}`,
                label: role.role,
                current: role.id === currentRoleId,
                completed: totalQuestions === answeredQuestions,
                started: userAnswersForRole.some((answer) =>
                    answer.question.roles?.some((role) => role.id === role.id),
                ),
                currentCompleted: form.formState.isValid,
            };
        });

    const ProgressionBarComponent =
        screenSize.width < 768 ? MobileProgressionBar : ProgressionBar;
    const QuestionsComponent =
        screenSize.width < 768 ? MobileSurveyQuestionnaire : SurveyQuestions;

    function handleButtonClick(
        event: React.MouseEvent<HTMLButtonElement>,
    ): void {
        // Check if the form is currently valid or all questions have been answered
        if (!form.formState.isValid) {
            // Form is not valid, do not proceed to the next page
            return;
        }

        if (getNextHref(selectedRolesForProgressBar)) {
            event.preventDefault();
            const nextHref = getNextHref(selectedRolesForProgressBar);
            if (nextHref) {
                router.push(nextHref);
            }
        } else {
            router.push("/thank-you");
        }
    }

    return (
        <div>
            <ProgressionBarComponent
                roles={selectedRolesForProgressBar}
                percentCompletedPerRole={percentCompletedPerRole ?? {}}
            />
            <h2 className="mb-4 mt-4 text-2xl font-bold">
                {userRoles.find((role) => slugify(role.role) === currentRole)
                    ?.role ?? ""}{" "}
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
                        userId={userId}
                        questions={questions}
                        answerOptions={answerOptions}
                        form={form}
                        saveAnswer={saveAnswer}
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
