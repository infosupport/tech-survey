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

export interface QuestionResult {
  id: string;
  userId: string;
  questionId: string;
  answerId: string;
  question: Question;
}

export interface User {
  id: string;
}

export interface Section {
  id: string;
  href: string;
  label: string;
  current: boolean;
  completed: boolean;
}
