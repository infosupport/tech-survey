import type { Session } from "next-auth";
import type { z } from "zod";
import type { api } from "~/trpc/react";

export interface Survey {
    id: string;
    surveyName: string;
}

export interface Role {
    id: string;
    role: string;
    default: boolean;
}

export interface Question {
    id: string;
    surveyId: string;
    questionText: string;
    roleIds?: string[];
    roles?: Role[];
}

export interface AnswerOption {
    id: string;
    option: number;
}

export interface Answers {
    questionId: string;
    answerId: string;
}
[];

export interface QuestionResult {
    id: string;
    userId: string;
    questionId: string;
    answerId: string;
    question: Question;
}

export interface PdfTransformedData {
    question: Question;
    answers: { questionId: string; answerId: string }[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    communicationPreferences: string[];
}

export interface Section {
    id: string;
    href: string;
    label: string;
    current: boolean;
    completed: boolean;
    started: boolean;
    currentCompleted: boolean;
}

export type TransformedData = Record<
    string,
    Record<string, Record<string, number>>
>;

export type QuestionSchema = Record<string, z.ZodEnum<[string, ...string[]]>>;

export interface HandleResponseSelectionParams {
    questionId: string;
    answerId: string;
    responses: Record<string, string>;
    setResponses: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    session: Session;
    submitResponse: SetQuestionResultMutation;
}

export type SetQuestionResultMutation = ReturnType<
    typeof api.survey.setQuestionResult.useMutation
>;

export interface Entry {
    userId: string;
    question: {
        roles?: { role?: string }[];
        questionText?: string;
    };
    answerId: string;
}

export interface UserAnswer {
    question: {
        id: string;
        roles?: Role[];
    };
    answerId: string;
}

export interface UserIdAndAnswerId {
    userId: string;
    answerId: string;
}

export interface ProgressBar {
    current: boolean;
    href: string;
}

export type SurveyResponse = {
    userId: string | undefined;
    questionId: string;
    answerId: string;
};

export type OnlineStatus = "isOnline" | "isOffline" | "isBackOnline";

export type DataByRoleAndQuestion = Record<
    string,
    Record<
        string,
        {
            name: string;
            email: string;
            communicationPreferences: string[] | undefined;
            answer: string;
            roles: string[];
        }[]
    >
>;

export type UserMap = Record<
    string,
    {
        name: string;
        email: string;
        communicationPreferences: string[];
        roles: string[];
    }
>;

export type AnswerOptionMap = Record<string, string>;

interface UserInformation {
    name: string;
    communicationPreferences: string[];
    counts: number[];
}

export type AggregatedDataByRole = Record<
    string,
    Record<string, UserInformation>
>;

export interface GroupDataQuestion {
    roles?: Role[];
    id: string;
    surveyId: string;
    questionText: string;
}

export interface UserAnswersForRole {
    question: GroupDataQuestion;
    id: string;
    userId: string;
    questionId: string;
    answerId: string;
}

export type UserAnswersForRoleArray = UserAnswersForRole[];
