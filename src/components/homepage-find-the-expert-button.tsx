"use client";

import { api } from "~/trpc/react";
import { ArrowRightDarkModeFriendly } from "./svg";
import { Button } from "./ui/button";
import Link from "next/link";

export const HomepageFindTheExpertButton = () => {
    const { mutate: logUsageMetric } =
        api.usageMetricLogger.logUsageMetric.useMutation();

    const handleLogging = () => {
        logUsageMetric({ logMessage: "find-the-expert-page-accessed" });
    };

    return (
        <Link href="/find-the-expert?role=General">
            <Button
                onClick={async () => {
                    handleLogging();
                }}
                variant="outline"
                className="border-2 border-[#bed62f]"
            >
                Find the Expert
                <ArrowRightDarkModeFriendly />
            </Button>
        </Link>
    );
};
