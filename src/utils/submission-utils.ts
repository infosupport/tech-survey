"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export const useSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitResponse = api.survey.setQuestionResult.useMutation({
    onSuccess: () => {
      console.log("Response submitted successfully");
      return true;
    },
    onError: (error) => {
      console.error("Error submitting response:", error);
      return false;
    },
  });

  return { isSubmitting, setIsSubmitting, submitResponse };
};
