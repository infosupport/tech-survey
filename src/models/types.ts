import type { z } from "zod";

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
    QuestionResult?: QuestionResult[];
}

export interface AnswerOption {
    id: string;
    option: number;
}

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

export interface Section {
    id: string;
    href: string;
    label: string;
    isCurrent: boolean;
    isCompleted: boolean;
    hasStarted: boolean;
    isCurrentCompleted: boolean;
}

export type TransformedData = Record<
    string,
    Record<string, Record<string, number>>
>;

export type QuestionSchema = Record<string, z.ZodEnum<[string, ...string[]]>>;

export interface UserAnswer {
    question: {
        id: string;
        roles?: Role[];
    };
    answerId: string;
}

export interface ProgressBar {
    isCurrent: boolean;
    href: string;
}

export type SurveyResponse = {
    userId: string;
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
            communicationPreferences: string[] | undefined;
            answer: string;
            roles: string[];
        }[]
    >
>;

interface UserInformation {
    name: string;
    id: string;
    communicationPreferences: string[];
    counts: number[];
}

export type AggregatedDataByRole = Record<
    string,
    Record<string, UserInformation>
>;
