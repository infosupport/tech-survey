"use server";

import { HomeLinkRenderer } from ".";
import { headers } from "next/headers";

export const HomeLinkServer = async () => {
    const currentPath = await headers().get("x-current-path")!;

    return HomeLinkRenderer(currentPath);
};
