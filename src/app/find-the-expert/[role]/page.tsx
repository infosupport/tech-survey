import type { Metadata } from "next";
import type { Session } from "next-auth";
import { Suspense } from "react";
import { ShowRolesWrapper } from "~/app/result/[role]/page";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import ShowDataTable from "~/components/show-data-table";
import { getServerAuthSession } from "~/server/auth";
import {
  aggregateDataByRole,
  createUserAndAnswerMaps,
  extractUniqueIds,
  fetchUserAnswersForRole,
  fetchUsersAndAnswerOptions,
  groupDataByRoleAndQuestion,
  sortResults,
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

const FindTheExpertPage = async () => {
  const session = await getServerAuthSession();

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
  const { userMap, answerOptionMap } = createUserAndAnswerMaps(
    users,
    answerOptions,
  );
  const dataByRoleAndQuestion = groupDataByRoleAndQuestion(
    userAnswersForRole,
    userMap,
    answerOptionMap,
  );
  const aggregatedDataByRole = aggregateDataByRole(
    userAnswersForRole,
    userMap,
    answerOptionMap,
  );
  sortResults(aggregatedDataByRole);

  return (
    <ShowDataTable
      dataByRoleAndQuestion={dataByRoleAndQuestion}
      aggregatedDataByRole={aggregatedDataByRole}
    />
  );
};

export default FindTheExpertPage;
