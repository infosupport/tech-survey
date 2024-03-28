import { useEffect, useState, useRef } from "react";
import type { SurveyResponse } from "~/models/types";
import { api } from "~/trpc/react";

export const useSubmitAnswers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<SurveyResponse[]>([]);
  const submitResponse = api.survey.setQuestionResult.useMutation();
  const submitAsyncRef = useRef<() => Promise<void>>();

  useEffect(() => {
    submitAsyncRef.current = async () => {
      setIsSubmitting(true);
      try {
        const mappedResponses = currentAnswers.map(
          ({ userId, questionId, answerId }) => ({
            userId: userId ?? "",
            questionId,
            answerId: answerId.toString(),
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
      console.error("Error saving responses:", error);
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
  };
};
