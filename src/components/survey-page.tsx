"use client";

import { api } from "~/trpc/react";
import SurveyQuestionnaire from "~/components/survey-questionnaire";
import { Loader2 } from "lucide-react";

function SurveyPage({
    userId,
    currentRole,
}: {
    userId: string;
    currentRole: string;
}) {
    const { data: surveyData } = api.surveys.getCurrentSurveyPageData.useQuery(
        { userId: userId, role: currentRole },
        { enabled: !!userId },
    );

    if (!surveyData) {
        return (
            <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
                <h1 className="mb-4 animate-pulse text-2xl font-bold">
                    Loading...
                </h1>
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
            <SurveyQuestionnaire
                surveyId={surveyData.survey.id}
                userId={userId}
                questions={surveyData.survey.questions}
                answerOptions={surveyData.answerOptions}
                userRoles={surveyData?.roles ?? []}
                userAnswersForRole={surveyData.userAnswersForRole}
                currentRole={currentRole}
            />
        </div>
    );
}

export default SurveyPage;
