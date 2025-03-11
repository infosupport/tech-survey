"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftDarkModeFriendly } from "~/components/svg";
import { Button } from "~/components/ui/button";

export const HomeLink = () => {
    const currentPathName = usePathname();

    return currentPathName !== "/" ? (
        <Link href="/" passHref>
            <Button variant="outline">
                <ArrowLeftDarkModeFriendly />
                Home
            </Button>
        </Link>
    ) : null;
};
