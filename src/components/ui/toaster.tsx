"use client";

import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "~/components/ui/toast";
import { TOAST_REMOVE_DELAY, useToast } from "~/components/ui/use-toast";

export function Toaster() {
    const { toasts } = useToast();

    return (
        <ToastProvider duration={TOAST_REMOVE_DELAY}>
            {toasts.map(function ({
                id,
                title,
                description,
                action,
                duration,
                ...props
            }) {
                if (title === "Failed to save responses. Retrying...") {
                    // Set a huge number for duration
                    duration = Infinity;
                }

                return (
                    <Toast key={id} duration={duration} {...props}>
                        <div className="grid gap-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && (
                                <ToastDescription>
                                    {description}
                                </ToastDescription>
                            )}
                        </div>
                        {action}
                        <ToastClose />
                    </Toast>
                );
            })}
            <ToastViewport />
        </ToastProvider>
    );
}
