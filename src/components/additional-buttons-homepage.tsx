"use server";

import { api } from "~/trpc/react";
import { ArrowRight, ArrowRightDarkModeFriendly } from "./svg";
import { Button } from "./ui/button";
import Link from "next/link";

const Buttons = () => {
    const { mutate: logUsageMetric } =
        api.usageMetricLogger.logUsageMetric.useMutation();

    const handleLogging = () => {
        logUsageMetric({ logMessage: "find-the-expert-page-accessed" });
    };

    return (
        <div className="mt-5 flex justify-center">
            <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
                <Link href="/survey/general">
                    <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
                        Go to survey
                        <ArrowRight />
                    </Button>
                </Link>
                <Link href="/result?role=General">
                    <Button
                        variant="outline"
                        className="border-2 border-[#bed62f]"
                    >
                        Show anonymized results
                        <ArrowRightDarkModeFriendly />
                    </Button>
                </Link>
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
            </div>
        </div>
    );
};

export default Buttons;
