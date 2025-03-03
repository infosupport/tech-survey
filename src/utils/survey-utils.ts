"use client";

import { z } from "zod";
import {
    type Question,
    type QuestionResult,
    type ProgressBar,
    type AnswerOption,
    type SurveyResponse,
    type QuestionSchema,
} from "~/models/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function getNextHref(
    selectedRolesForProgressBar: ProgressBar[],
): string | undefined {
    const index = selectedRolesForProgressBar.findIndex((role) => role.current);
    return selectedRolesForProgressBar[index + 1]?.href;
}

export function progressionInfo(
    percentCompletedPerRole: Record<
        string,
        { totalQuestions: number; answeredQuestions: number }
    >,
) {
    const completedRoles = Object.values(percentCompletedPerRole).reduce(
        (acc, role) => {
            return role.answeredQuestions === role.totalQuestions
                ? acc + 1
                : acc;
        },
        0,
    );
    const totalRoles = Object.keys(percentCompletedPerRole).length;
    const answeredQuestions = Object.values(percentCompletedPerRole).reduce(
        (acc, role) => acc + role.answeredQuestions,
        0,
    );
    const totalQuestions = Object.values(percentCompletedPerRole).reduce(
        (acc, role) => acc + role.totalQuestions,
        0,
    );
    const progressPercentage = (answeredQuestions / totalQuestions) * 100;

    return {
        completedRoles,
        totalRoles,
        progressPercentage,
    };
}

export function hasAnsweredAllQuestionsForRole(
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

export function useGenerateFormAndSchema(
    unansweredQuestions: Question[],
    answerOptions: AnswerOption[],
    formValues: QuestionResult[],
): {
    form: ReturnType<typeof useForm>;
    FormSchema: z.ZodObject<QuestionSchema>;
} {
    const FormSchema: z.ZodObject<QuestionSchema> = z.object(
        unansweredQuestions.reduce<QuestionSchema>((schema, question) => {
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
        defaultValues: formValues.reduce((values, answer) => {
            return {
                ...values,
                [answer.questionId]: answer.answerId,
            };
        }, {}),
    });

    return { form, FormSchema };
}

export const findAnswerId = (
    currentAnswers: SurveyResponse[],
    questionId: string,
): string | undefined => {
    const response = currentAnswers.find(
        (response) => response.questionId === questionId,
    );
    return response?.answerId;
};
