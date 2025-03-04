"use client";

import { usePathname } from "next/navigation";
import { HomeLinkRenderer } from ".";

export const HomeLinkClient = async () => {
    const currentPath = usePathname();

    return HomeLinkRenderer(currentPath);
};
