import { getServerAuthSession } from "~/server/auth";
import SelectRole from "../components/select-role";

import React, { Suspense } from "react";
import { type Session } from "next-auth";
import { db } from "~/server/db";
import RoleSelectionSkeleton from "~/components/loading/role-selection-loader";
import Buttons from "~/components/additional-buttons-homepage";

const Home: React.FC = async () => {
  const session = await getServerAuthSession();

  if (process.env.FRESH_RUN === "true") {
    // Find users with the name 'e2eTestAccount'
    const users = await db.user.findMany({
      where: {
        name: "e2eTestAccount",
      },
      include: {
        roles: true,
        questionResults: true,
      },
    });

    // For each user, disconnect all roles
    for (const user of users) {
      await db.user.update({
        where: { id: user.id },
        data: {
          roles: {
            disconnect: user.roles.map((role) => ({ id: role.id })),
          },
        },
      });
    }

    // for each user, remove all question results
    for (const user of users) {
      await db.questionResult.deleteMany({
        where: {
          userId: user.id,
        },
      });
    }
  }

  return (
    <div>
      <div className="container mx-auto py-16 sm:px-4 sm:py-16 md:px-8 lg:px-16">
        <h1 className="text-center text-5xl font-extrabold tracking-tight">
          Welcome to the{" "}
          <span className="block text-custom-primary sm:inline">
            Info Support
          </span>
          <span className="block sm:inline"> Tech Survey of 2024</span>
        </h1>

        <div className="items-center justify-center  py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="mb-8 text-lg ">
                An organization-wide initiative designed for all our consultant
                colleagues. This comprehensive survey covers a wide array of
                technological roles, ranging from &quot;Data Engineering&quot;
                to &quot;Product Owner / Analyst / Requirements Engineer.&quot;
                The data gathered reflects inputs from diverse areas and
                communities within the realm of technology, collected over the
                past year.
              </p>
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-bold ">
                  Our survey serves several essential purposes:
                </h2>
                <ol className="list-decimal pl-4 text-left">
                  <li className="mb-4">
                    <strong>Self-Evaluation:</strong> As a consultant, this
                    survey offers you a valuable opportunity to assess your
                    knowledge across various technologies. It enables you to
                    gauge your familiarity with different areas and identify
                    areas for further improvement or exploration through
                    additional training or experimentation.
                  </li>
                  <li className="mb-4">
                    <strong>Thermometer:</strong> For community leads, area
                    leads, teachers, and managers, the survey acts as a
                    thermometer, providing insights into the prevailing trends
                    among Info Supporters. For instance, it offers visibility
                    into the collective expertise in Java or any other
                    technology, guiding decisions related to training
                    initiatives or topics for discussion in ISKA (Info Support
                    Knowledge Academy).
                  </li>
                  <li className="mb-4">
                    <strong>&apos;Find the Expert&apos;:</strong> Gain access to
                    a powerful search functionality that empowers you to
                    pinpoint experts in specific technologies at Info Support.
                    This feature proves invaluable when clients have precise
                    inquiries, enabling you to quickly locate the consultant
                    with the expertise needed to address their needs.
                  </li>
                </ol>
              </div>
              <p className="mb-8 text-lg ">
                Join us in leveraging the collective expertise of Info Support
                to drive innovation and excellence in technology solutions.
              </p>
            </div>
            {/* If the user is logged in, show the SelectRole component */}
            {session && (
              <div>
                <Suspense fallback={<RoleSelectionSkeleton />}>
                  <SelectRoleWrapper session={session} />
                </Suspense>
              </div>
            )}

            <Buttons session={session} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Define a separate component to encapsulate the SelectRole component and database calls
const SelectRoleWrapper: React.FC<{ session: Session }> = async ({
  session,
}) => {
  const [roles, userRoles] = await Promise.all([
    db.role.findMany(),
    db.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        roles: true,
      },
    }),
  ]);

  const userSelectedRoles = userRoles?.roles ?? [];

  return (
    <SelectRole
      session={session}
      roles={roles}
      userSelectedRoles={userSelectedRoles}
    />
  );
};

export default Home;
