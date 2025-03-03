"use client";

import { api } from "~/trpc/react";
import SurveyQuestionnaire from "~/components/survey-questionnaire";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

function SurveyPage({ userId }: { userId: string }) {
    const pathname = usePathname() || "";

    // get the current role from the url, which is /survey/[role]
    const currentRole = pathname.split("/").pop() ?? "";

    const { data: surveyData } = api.survey.getSurveyPageData.useQuery(
        { userId: userId, role: currentRole },
        { enabled: !!userId },
    );

    if (!surveyData) {
        return (
            <div>
                <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
                    <h1 className="mb-4 animate-pulse text-2xl font-bold">
                        Loading...
                    </h1>
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
                <SurveyQuestionnaire
                    userId={userId}
                    questions={surveyData.questions}
                    answerOptions={surveyData.answerOptions}
                    userRoles={surveyData?.roles ?? []}
                    userAnswersForRole={surveyData.userAnswersForRole}
                />
            </div>
        </div>
    );
}

export default SurveyPage;
