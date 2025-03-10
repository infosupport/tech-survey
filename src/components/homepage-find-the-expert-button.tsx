"use client";

import { api } from "~/trpc/react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRightDarkModeFriendly } from "~/components/svg";

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
