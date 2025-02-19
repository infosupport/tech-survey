"use client";

import { useEffect } from "react";
import { toast } from "~/components/ui/use-toast";
import { ToastAction } from "~/components/ui/toast";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        toast({
            title: "Something went wrong!",
            description: `There was a problem try again or refresh the page.`,
            variant: "destructive",
            action: (
                <ToastAction onClick={() => reset()} altText="Try again">
                    Try again
                </ToastAction>
            ),
        });
    }, [error, reset]);

    return null;
}
