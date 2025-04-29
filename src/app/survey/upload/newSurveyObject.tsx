import { z } from "zod";

export const newSurveyObject = z.object({
    surveyDate: z.string().transform((val) => new Date(val)),
    surveyName: z.string(),
    questions: z.array(
        z.object({
            questionText: z.string(),
            roles: z.array(
                z.object({
                    id: z.string(),
                    role: z.string(),
                    isDefault: z.boolean(),
                }),
            ),
        }),
    ),
});
