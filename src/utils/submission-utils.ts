"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export const useSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitResponse = api.survey.setQuestionResult.useMutation();

  return { isSubmitting, setIsSubmitting, submitResponse };
};
