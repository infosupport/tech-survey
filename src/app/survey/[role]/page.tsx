import { Suspense } from "react";
import SurveyQuestionLoader from "~/components/loading/survey-question-loader";

import { type Metadata } from "next";
import SurveyPage from "~/components/survey-page";
import { getServerAuthSession } from "~/server/auth";

export const metadata: Metadata = {
    title: "Survey",
};

const SuspenseSurveyData = async () => {
    const session = await getServerAuthSession();

    if (!session) {
        return <div>Unauthenticated</div>;
    }

    return (
        <Suspense fallback={<SurveyQuestionLoader />}>
            <SurveyPage userId={session.user.id} />
        </Suspense>
    );
};
export default SuspenseSurveyData;
