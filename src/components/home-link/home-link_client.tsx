"use client";

import { usePathname } from "next/navigation";
import { HomeLinkRenderer } from ".";

export const HomeLinkClient = () => {
    const currentPath = usePathname();

    return HomeLinkRenderer(currentPath);
};
