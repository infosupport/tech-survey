import type { Metadata } from "next";
import type { Session } from "next-auth";

import { Suspense } from "react";
import ButtonSkeleton from "~/components/loading/button-loader";
import { Login } from "~/components/login";
import { getServerAuthSession } from "~/server/auth";
import ProfilePageSearch from "~/components/ui/profile-page-search";

export const metadata: Metadata = {
    title: "Find the expert",
};

const LoginSection = ({ session }: { session: Session | null }) => (
    <>
        <p className="text-center text-lg">
            Unable to search people without logging in.
        </p>
        <Login session={session} text={"Log in"} />
    </>
);

const ContentSection = ({ name }: { name: string }) => (
    <>
        <Suspense fallback={<ButtonSkeleton />}>
            <ProfilePageSearch />
        </Suspense>
        <Suspense fallback={<ButtonSkeleton />}>
            {name ? <ProfilePage name={name} /> : null}
        </Suspense>
    </>
);

const ProfilePage = async ({ name }: { name: string }) => {
    return (
        <div>
            <h2 className="text-center text-2xl font-bold">
                Profile page for {name}
            </h2>
        </div>
    );
};

const ProfilePageWrapper = async (context: {
    searchParams: { name: string };
}) => {
    const session = await getServerAuthSession();

    return (
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                <span className="block text-custom-primary sm:inline">
                    Info Support
                </span>
                <span className="block sm:inline">
                    {" "}
                    Tech Survey - Profile page
                </span>
            </h1>
            {session ? (
                <ContentSection name={context.searchParams.name} />
            ) : (
                <LoginSection session={session} />
            )}
        </div>
    );
};

export default ProfilePageWrapper;
