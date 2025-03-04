import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowLeftDarkModeFriendly } from "./svg";
import { usePathname } from "next/navigation";

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
