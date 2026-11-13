"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SessionError, type ParticipantSession, type SaveResult } from "@malverdesoftware/session-client";
import type { ResponseBody } from "@/lib/model";

export type SyncState = "saved" | "pending" | "saving" | "on-device" | "conflict" | "closed" | "error";

export const SYNC_TEXT: Record<SyncState, string> = {
  saved: "Saved",
  pending: "Changes not saved yet",
  saving: "Saving…",
  "on-device": "Saved on this device. It will sync when you're back online.",
  conflict: "This sort was changed on another device. Reload to continue from the latest version.",
  closed: "The study team has closed this activity. Your last saved version is kept.",
  error: "Couldn't save. Your changes are still on this page.",
};

const fromResult = (r: SaveResult): SyncState => (r.state === "SAVED" ? "saved" : "on-device");
const fromError = (e: unknown): SyncState =>
  e instanceof SessionError && e.code === "VERSION_CONFLICT"
    ? "conflict"
    : e instanceof SessionError && e.code === "SESSION_CLOSED"
      ? "closed"
      : "error";

// Saves one second after the last change, at once when the page is hidden, and again when the device reconnects.
export function useAutosave(session: ParticipantSession, body: ResponseBody, enabled: boolean) {
  const [state, setState] = useState<SyncState>("saved");
  const saved = useRef(JSON.stringify(body));
  const latest = useRef(body);
  // Updated right after each commit, before the effects below read it.
  useLayoutEffect(() => {
    latest.current = body;
  }, [body]);

  const save = useCallback(async () => {
    const snapshot = latest.current;
    const text = JSON.stringify(snapshot);
    if (text === saved.current) return;
    setState("saving");
    try {
      const result = await session.saveDraft(snapshot);
      saved.current = text;
      setState(JSON.stringify(latest.current) === text ? fromResult(result) : "pending");
    } catch (e) {
      setState(fromError(e));
    }
  }, [session]);

  useEffect(() => {
    if (!enabled || JSON.stringify(body) === saved.current) return;
    setState("pending");
    const timer = setTimeout(() => void save(), 1000);
    return () => clearTimeout(timer);
  }, [body, enabled, save]);

  useEffect(() => {
    if (!enabled) return;
    const hidden = () => document.visibilityState === "hidden" && void save();
    const online = () =>
      void session.retryPending().then(
        (r) => setState((s) => (s === "on-device" ? fromResult(r) : s)),
        (e) => setState(fromError(e)),
      );
    const leaving = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== saved.current) e.preventDefault();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", leaving);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", leaving);
    };
  }, [enabled, save, session]);

  return { state, saveNow: save };
}
