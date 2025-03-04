import Link from "next/link";
import { Button } from "~/components/ui/button";
import { DesktopIcon, PersonIcon } from "@radix-ui/react-icons";

const FindTheExpertPage = async () => {
    return (
        <div className="mb-5 mt-5 flex flex-col items-center justify-center gap-6 md:flex-row">
            <Link href="/find-the-expert/tech-page">
                <Button
                    variant="outline"
                    className="border-2 border-[#bed62f] px-8 py-8 text-lg"
                    name="Profile page"
                >
                    Find by tech
                    <DesktopIcon className="ml-2 h-6 w-6" />
                </Button>
            </Link>
            <Link href="/find-the-expert/profile-page">
                <Button
                    variant="outline"
                    className="border-2 border-[#bed62f] px-8 py-8 text-lg"
                    name="Profile page"
                >
                    Find by name
                    <PersonIcon className="ml-2text-9xl h-6 w-6" />
                </Button>
            </Link>
        </div>
    );
};
export default FindTheExpertPage;
