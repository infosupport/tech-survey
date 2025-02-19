"use client";

import { useState, useEffect } from "react";
import { type OnlineStatus } from "~/models/types";

function useOnlineStatus(): OnlineStatus {
    const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>("isOnline");
    const [prevOnline, setPrevOnline] = useState(true);

    useEffect(() => {
        function handleOnline() {
            setOnlineStatus(() => {
                if (!prevOnline) return "isBackOnline";
                return "isOnline";
            });
            setPrevOnline(true);
        }

        function handleOffline() {
            setOnlineStatus("isOffline");
            setPrevOnline(false);
        }

        setPrevOnline(window.navigator.onLine);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [prevOnline]);

    return onlineStatus;
}

export default useOnlineStatus;
