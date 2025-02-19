"use client";

import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { api } from "~/trpc/react";
import { Login } from "./login";
import { ArrowRightDarkModeFriendly } from "./svg";
import { Button } from "./ui/button";

const Buttons = ({ session }: { session: Session | null }) => {
    const { mutate: logUsageMetric } =
        api.usageMetricLogger.logUsageMetric.useMutation();

    const handleLogging = () => {
        logUsageMetric({ logMessage: "find-the-expert-page-accessed" });
    };

    return (
        <div className="mt-5 flex justify-center">
            <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
                {!session && (
                    <>
                        <Login session={session} text="Go to survey" />
                        <Button
                            onClick={() =>
                                signIn("azure-ad", {
                                    callbackUrl: "/result?role=General",
                                })
                            }
                            variant="outline"
                            className="border-2 border-[#bed62f]"
                        >
                            Show anonymized results
                            <ArrowRightDarkModeFriendly />
                        </Button>
                        <Button
                            onClick={async () => {
                                handleLogging();
                                await signIn("azure-ad", {
                                    callbackUrl:
                                        "/find-the-expert?role=General",
                                });
                            }}
                            variant="outline"
                            className="border-2 border-[#bed62f]"
                        >
                            Find the Expert
                            <ArrowRightDarkModeFriendly />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Buttons;
