import { Suspense } from "react";
import { HomeLinkServer } from "./home-link_server";
import { HomeLinkClient } from "./home-link_client";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowLeftDarkModeFriendly } from "../svg";

export const HomeLink = async () => {
    return (
        <Suspense fallback={<HomeLinkServer />}>
            <HomeLinkClient />
        </Suspense>
    );
};

export const HomeLinkRenderer = async (currentPath: string) => {
    return currentPath !== "/" ? (
        <Link href="/" passHref>
            <Button variant="outline">
                <ArrowLeftDarkModeFriendly />
                Home
            </Button>
        </Link>
    ) : null;
};
