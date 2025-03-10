import { TRPCClientError } from "@trpc/client";
import type { Session } from "next-auth";

/**
 * Ensure users can only makes requests for themselves
 */
export const checkUserAuthorization = (session: Session, userId: string) => {
    if (session.user.id !== userId) {
        throw new TRPCClientError("User not authorized");
    }
};
