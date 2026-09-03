"use client";

import { useEffect } from "react";
import { flushOutbox } from "@/lib/offline/sync";

export default function OfflineSync() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Fires once when connectivity returns — not a poll. If already online
    // on load, flush anything queued from a prior offline session.
    const onOnline = () => {
      flushOutbox();
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) flushOutbox();

    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
