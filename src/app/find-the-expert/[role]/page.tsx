import type { Metadata } from "next";
import type { Session } from "next-auth";

import { Suspense } from "react";
import { ShowRolesWrapper } from "~/app/result/[role]/page";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import ShowDataTable from "~/components/show-data-table";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";
import {
  extractUniqueIds,
  fetchUserAnswersForRole,
  fetchUsersAndAnswerOptions,
} from "~/utils/data-manipulation";

export const metadata: Metadata = {
  title: "Find the expert",
};

const LoginSection = ({ session }: { session: Session | null }) => (
  <>
    <p className="text-center text-lg">
      Unable to find experts without logging in.
    </p>
    <Login session={session} text={"Log in"} />
  </>
);

const ContentSection = () => (
  <>
    <Suspense fallback={<ButtonSkeleton />}>
      <ShowRolesWrapper path="/find-the-expert" />
    </Suspense>
    <Suspense fallback={<ButtonSkeleton />}>
      <ShowTableWrapper />
    </Suspense>
  </>
);

const FindTheExpertPage = async (context: { params: { role: any; }; }) => {
  const session = await getServerAuthSession();
  api.usageMetricLogger.logUsageMetric.mutate({logMessage: 'find-the-expert-page-filtered-on-role'});
  
  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <h1 className="text-center text-5xl font-extrabold tracking-tight">
        <span className="block text-custom-primary sm:inline">
          Info Support
        </span>
        <span className="block sm:inline"> Tech Survey - Find the expert</span>
      </h1>
      {session ? <ContentSection /> : <LoginSection session={session} />}
    </div>
  );
};

const ShowTableWrapper = async () => {
  const userAnswersForRole = await fetchUserAnswersForRole();
  const { userIds, answerIds } = extractUniqueIds(userAnswersForRole);
  const [users, answerOptions] = await fetchUsersAndAnswerOptions(
    userIds,
    answerIds,
  );

  return (
    <ShowDataTable
      userAnswersForRole={userAnswersForRole}
      users={users}
      answerOptions={answerOptions}
    />
  );
};

export default FindTheExpertPage;
