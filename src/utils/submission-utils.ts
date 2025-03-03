"use client";

import { useEffect, useState } from "react";
import { toast } from "~/components/ui/use-toast";
import type { QuestionResult, SurveyResponse } from "~/models/types";
import { api } from "~/trpc/react";
import { useDebouncedCallback } from "use-debounce";

export const useSubmitAnswers = (userAnswersForRole: QuestionResult[]) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentAnswers, setCurrentAnswers] =
        useState<QuestionResult[]>(userAnswersForRole);
    const [error, setError] = useState<string | null>(null);
    const submitResponse = api.survey.setQuestionResult.useMutation();

    useEffect(() => {
        if (submitResponse.isError) {
            setError(String(submitResponse.error));
            toast({
                title: "Something went wrong!",
                description: `Unable to select an answer. Please try again or refresh the page.`,
                variant: "destructive",
            });
        }
    }, [submitResponse.isError, submitResponse.error]);

    const saveAnswer = async (answer: SurveyResponse) => {
        setIsSubmitting(true);
        const newAnswer = await submitResponse.mutateAsync(answer);
        setIsSubmitting(false);
        setCurrentAnswers((answers) => {
            const existingAnswer = answers.find(
                (ans) => ans.id === newAnswer.id,
            );
            if (existingAnswer) {
                return [
                    ...answers.filter((ans) => ans.id !== newAnswer.id),
                    newAnswer,
                ];
            } else {
                return [...answers, newAnswer];
            }
        });
    };

    return {
        // TODO: Debounce gaat over alle calls ipv per antwoord
        saveAnswer: useDebouncedCallback(saveAnswer, 250),
        isSubmitting,
        currentAnswers,
        error,
    };
};
