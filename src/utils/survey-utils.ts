"use client";

import { z } from "zod";
import {
    type Question,
    type QuestionResult,
    type ProgressBar,
    type AnswerOption,
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

    let progressPercentage = (answeredQuestions / totalQuestions) * 100;
    if (progressPercentage === Infinity || isNaN(progressPercentage)) {
        progressPercentage = 0;
    }

    return {
        completedRoles,
        totalRoles,
        progressPercentage,
    };
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
