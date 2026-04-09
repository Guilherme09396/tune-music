import { useState, useEffect } from "react";

const STORAGE_KEY = "soundflow-offline-mode";

let listeners = [];
let globalValue = localStorage.getItem(STORAGE_KEY) === "true";

export function useOfflineMode() {
    const [forceOffline, setForceOffline] = useState(globalValue);

    useEffect(() => {
        listeners.push(setForceOffline);
        return () => {
            listeners = listeners.filter((l) => l !== setForceOffline);
        };
    }, []);

    const toggle = () => {
        const next = !globalValue;
        globalValue = next;
        localStorage.setItem(STORAGE_KEY, String(next));
        listeners.forEach((l) => l(next));
    };

    const isOffline = forceOffline || !navigator.onLine;

    return { forceOffline, toggle, isOffline };
}
