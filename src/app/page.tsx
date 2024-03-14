import { getServerAuthSession } from "~/server/auth";
import { Login } from "./_components/login";
import SelectRole from "./_components/select-role";
import { ModeToggle } from "./_components/mode-toggle";

import React, { Suspense } from "react";
import { type Session } from "next-auth";
import { db } from "~/server/db";

const Home: React.FC = async () => {
  const session = await getServerAuthSession();

  // Use Suspense to suspend rendering while the data is being fetched
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="absolute right-4 top-4 z-50 flex items-center space-x-4">
        {session && (
          <Suspense fallback={<div>Loading...</div>}>
            <LoginWrapper session={session} />
          </Suspense>
        )}
        <ModeToggle />
      </div>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-center text-5xl font-extrabold tracking-tight">
          <span className="block text-custom-primary sm:inline">
            Info Support
          </span>
          <span className="block sm:inline"> Tech Survey</span>
        </h1>
        {!session && (
          <div>
            <div className="max-w-2xl text-center">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. An nisi
                populari fama? An est aliquid per se ipsum flagitiosum, etiamsi
                nulla comitetur infamia?{" "}
                <i>
                  Quid turpius quam sapientis vitam ex insipientium sermone
                  pendere?
                </i>{" "}
                Sextilio Rufo, cum is rem ad amicos ita deferret, se esse
                heredem Q. Duo Reges: constructio interrete. Non quaeritur autem
                quid naturae tuae consentaneum sit, sed quid disciplinae. Mene
                ergo et Triarium dignos existimas, apud quos turpiter loquare?
                Scio enim esse quosdam, qui quavis lingua philosophari possint;{" "}
              </p>
            </div>
            <Login session={session} />
          </div>
        )}

        {/* If the user is logged in, show the SelectRole component */}
        {session && (
          <div>
            <Suspense fallback={<div>Loading...</div>}>
              <SelectRoleWrapper session={session} />
            </Suspense>
          </div>
        )}
      </div>
    </main>
  );
};

// Define a separate component to encapsulate the SelectRole component and database calls
const SelectRoleWrapper: React.FC<{ session: Session }> = async ({
  session,
}) => {
  const [roles, userRoles] = await Promise.all([
    // new Promise((resolve) => setTimeout(resolve, 3000)).then(() =>
    db.role.findMany(),
    // ),
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

const LoginWrapper: React.FC<{ session: Session }> = async ({ session }) => {
  return <Login session={session} />;
};

export default Home;
