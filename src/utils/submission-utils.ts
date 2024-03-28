"use client";

import { useEffect, useState } from "react";
import type { SetQuestionResultMutation } from "~/models/types";
import { api } from "~/trpc/react";

export const useSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitResponse = api.survey.setQuestionResult.useMutation();

  return { isSubmitting, setIsSubmitting, submitResponse };
};

type MutateAsyncParams = Parameters<SetQuestionResultMutation["mutateAsync"]>;

export const useSubmitAnswers = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);

  if (isSubmitting) {
    return false;
  }

  const submitResponse = api.survey.setQuestionResult.useMutation();

  useEffect(() => {
    // Move below to a useEffect
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await submitResponse.mutateAsync(answers);
    } finally {
      // TODO If more answers came in in the meantime, submit those instead.
      setIsSubmitting(false);
    }
    return true;
  }, [currentAnswers, isSubmitting]);

  return {
    // TODO: Accept answers to send
    saveAnswer: async (answer: Answer) => {
      setCurrentAnswers((answers) => [...ansers, answer]);
    },
    isSubmitting
  };
};
