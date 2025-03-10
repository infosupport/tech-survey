"use server";

import { HomepageFindTheExpertButton } from "~/components/homepage-find-the-expert-button";
import Link from "next/link";
import { auth } from "~/auth";
import { Button } from "~/components/ui/button";
import { ArrowRight, ArrowRightDarkModeFriendly } from "~/components/svg";

const Buttons = async () => {
    const session = await auth();

    if (session) {
        // When logged in, we show the buttons in a different component
        return null;
    }

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
                <HomepageFindTheExpertButton />
            </div>
        </div>
    );
};

export default Buttons;
