"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "~/components/ui/use-toast";
import type { SurveyResponse } from "~/models/types";
import { api } from "~/trpc/react";

export const useSubmitAnswers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<SurveyResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const submitResponse = api.survey.setQuestionResult.useMutation();
  const submitAsyncRef = useRef<() => Promise<void>>();

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

  useEffect(() => {
    submitAsyncRef.current = async () => {
      setIsSubmitting(true);
      try {
        const mappedResponses = currentAnswers.map(
          ({ userId, questionId, answerId }) => ({
            userId: userId ?? "",
            questionId,
            answerId: answerId.toString(),
            roleIds: [],
          }),
        );

        await submitResponse.mutateAsync(mappedResponses);
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [submitResponse, currentAnswers]);

  useEffect(() => {
    const submitAsync = async () => {
      if (submitAsyncRef.current) {
        await submitAsyncRef.current();
      }
    };

    submitAsync().catch((error) => {
      throw new Error(String(error));
    });
  }, [currentAnswers]);

  return {
    saveAnswer: async (answer: SurveyResponse) => {
      setCurrentAnswers((answers) => {
        const updatedAnswers = answers.filter(
          (ans) =>
            ans.userId !== answer.userId ||
            ans.questionId !== answer.questionId,
        );
        return [...updatedAnswers, answer];
      });
    },
    isSubmitting,
    currentAnswers,
    error,
  };
};
