import { usePathname } from "next/navigation";

export function GetCurrentRoleFromPath() {
    const pathname = usePathname() || "";

    const currentRole = pathname.split("/").pop() ?? "";

    return currentRole;
}
