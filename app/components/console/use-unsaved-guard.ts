"use client";
import { useEffect } from "react";

// Asks before leaving while the only copy of a key file (or of its latest changes) is in this page.
export function useUnsavedGuard(unsaved: boolean) {
  useEffect(() => {
    if (!unsaved) return;
    const leaving = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", leaving);
    return () => window.removeEventListener("beforeunload", leaving);
  }, [unsaved]);
}
