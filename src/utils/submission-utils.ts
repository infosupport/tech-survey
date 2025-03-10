"use client";

import { useEffect, useState } from "react";
import { toast } from "~/components/ui/use-toast";
import type { QuestionResult, SurveyResponse } from "~/models/types";
import { api } from "~/trpc/react";

export const useSubmitAnswers = (userAnswersForRole: QuestionResult[]) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amountOfAnsweredQuestions, setAmountOfAnsweredQuestions] =
        useState<number>(userAnswersForRole.length);
    const submitResponse = api.surveys.setQuestionResultForUser.useMutation();

    useEffect(() => {
        if (submitResponse.isError) {
            toast({
                title: "Something went wrong!",
                description: `Unable to select an answer. Please try again or refresh the page.`,
                variant: "destructive",
            });
        }
    }, [submitResponse.isError, submitResponse.error]);

    const saveAnswer = async (answer: SurveyResponse) => {
        setIsSubmitting(true);
        const newAnswerAdded = await submitResponse.mutateAsync(answer);
        setIsSubmitting(false);
        setAmountOfAnsweredQuestions((prev) => {
            if (newAnswerAdded) {
                return prev + 1;
            }
            return prev;
        });
    };

    return {
        saveAnswer: saveAnswer,
        isSubmitting,
        amountOfAnsweredQuestions,
    };
};
