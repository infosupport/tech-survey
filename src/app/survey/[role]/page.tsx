import { Suspense } from "react";
import SurveyQuestionLoader from "~/components/loading/survey-question-loader";

import { type Metadata } from "next";
import SurveyPage from "~/components/survey-page";
import { auth } from "~/auth";

export const metadata: Metadata = {
    title: "Survey",
};

const SuspenseSurveyData = async ({
    params,
}: {
    params: Promise<{ role: string }>;
}) => {
    const session = (await auth())!;
    const role = decodeURIComponent((await params).role.replace(/\+/g, " "));

    if (!session) {
        return <div>Unauthenticated</div>;
    }

    return (
        <Suspense fallback={<SurveyQuestionLoader />}>
            <SurveyPage userId={session.user.id} currentRole={role} />
        </Suspense>
    );
};
export default SuspenseSurveyData;
