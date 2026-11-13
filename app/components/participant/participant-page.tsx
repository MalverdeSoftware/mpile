"use client";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  SessionError,
  joinSession,
  parseParticipantLink,
  type ParticipantCredentials,
  type ParticipantSession,
} from "@malverdesoftware/session-client";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import { ControlsHeight } from "@jetbrains/ring-ui-built/components/global/controls-height";
import { H1 } from "@jetbrains/ring-ui-built/components/heading/heading";
import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline";
import Text from "@jetbrains/ring-ui-built/components/text/text";
import { Frame } from "../frame";
import { checkResponse, readDefinition, type SortDefinition } from "@/lib/session";
import { emptyBody, type ResponseBody } from "@/lib/model";
import PasscodeForm from "./passcode-form";
import SortWorkspace from "./sort-workspace";
import Submitted from "./submitted";

type Screen =
  | { name: "opening" }
  | { name: "passcode"; error: string }
  | { name: "unavailable"; title: string; message: string; retry: boolean }
  | { name: "working"; session: ParticipantSession; definition: SortDefinition; body: ResponseBody }
  | { name: "sending"; session: ParticipantSession; definition: SortDefinition }
  | { name: "submitted"; definition: SortDefinition; copy: ResponseBody | null };

const APP = "mpile";
const BAD_LINK: Screen = {
  name: "unavailable",
  title: "This link is incomplete",
  message: "Open the full link you were sent, in one piece. If it still doesn't work, ask the study team to send it again.",
  retry: false,
};

const body = (definition: SortDefinition, value: unknown): ResponseBody | null => {
  try {
    return value ? checkResponse(definition, value) : null;
  } catch {
    return null;
  }
};

function screenFor(error: unknown): Screen {
  const code = error instanceof SessionError ? error.code : "";
  if (code === "PASSCODE_REQUIRED") return { name: "passcode", error: "" };
  if (code === "WRONG_PASSCODE")
    return { name: "passcode", error: "That passcode doesn't match this link. Check the six digits and try again." };
  if (code === "TOO_MANY_ATTEMPTS") {
    const minutes = Math.max(1, Math.ceil(Number((error as SessionError).details?.retryAfter ?? 3600) / 60));
    return { name: "passcode", error: `Too many tries. Wait about ${minutes} minutes, then try again.` };
  }
  if (code === "BAD_LINK" || code === "DECRYPT_FAILED") return BAD_LINK;
  if (code === "SESSION_EXPIRED" || code === "NOT_FOUND")
    return { name: "unavailable", title: "This activity has ended", message: "The link is no longer active. If you think this is a mistake, contact the person who sent it.", retry: false };
  if (code === "NETWORK")
    return { name: "unavailable", title: "Can't reach the activity", message: "Check your internet connection, then try again.", retry: true };
  return { name: "unavailable", title: "Something went wrong", message: (error as Error).message || "Please try again.", retry: true };
}

function screenForSession(session: ParticipantSession): Screen {
  const definition = readDefinition(session.definition);
  if (session.status === "SUBMITTED") return { name: "submitted", definition, copy: body(definition, session.submitted) };
  if (session.status === "SUBMITTING") return { name: "sending", session, definition };
  if (session.isClosed)
    return { name: "unavailable", title: "This activity is closed", message: "The study team has closed this activity. Thank you for your time.", retry: false };
  return { name: "working", session, definition, body: body(definition, session.draft) ?? emptyBody() };
}

// The page reloads when the fragment changes (below), so the link never needs a subscription.
const noSubscription = () => () => {};

export default function ParticipantPage() {
  // The server has no link to read; the client reads it once hydrated.
  const href = useSyncExternalStore(noSubscription, () => location.href, () => null);
  const credentials = useMemo((): ParticipantCredentials | null | undefined => {
    if (href === null) return undefined;
    try {
      return parseParticipantLink(href);
    } catch {
      return null;
    }
  }, [href]);
  const [current, setScreen] = useState<Screen>({ name: "opening" });
  const screen = credentials === null ? BAD_LINK : current;
  const [busy, setBusy] = useState(false);

  // Callers that show a busy state (the buttons below) set it before calling.
  const open = useCallback(
    (creds: ParticipantCredentials, passcode?: string, sharedDevice = false) =>
      joinSession(creds, {
        app: APP,
        relayUrl: `${location.origin}/relay`,
        ...(passcode ? { passcode } : {}),
        rememberOnDevice: !sharedDevice,
      })
        .then(screenForSession)
        .catch(screenFor)
        .then((next) => setScreen(next))
        .finally(() => setBusy(false)),
    [],
  );

  useEffect(() => {
    if (credentials) void open(credentials);
  }, [credentials, open]);

  useEffect(() => {
    // Opening a different personal link in the same tab changes only the fragment; start fresh.
    const reopen = () => location.reload();
    window.addEventListener("hashchange", reopen);
    return () => window.removeEventListener("hashchange", reopen);
  }, []);

  // A submission stored on this device is resent until the server confirms it.
  useEffect(() => {
    if (screen.name !== "sending") return;
    const { session, definition } = screen;
    const send = () =>
      void session.retryPending().then(
        (r) => r.state === "SAVED" && setScreen({ name: "submitted", definition, copy: body(definition, session.submitted) }),
        (e) => setScreen(screenFor(e)),
      );
    send();
    window.addEventListener("online", send);
    return () => window.removeEventListener("online", send);
  }, [screen]);

  return (
    <Frame>
      {screen.name === "opening" && (
        <main className="page-narrow" aria-busy="true">
          <LoaderInline /> <Text>Opening activity…</Text>
        </main>
      )}
      {screen.name === "passcode" && credentials && (
        <PasscodeForm error={screen.error} busy={busy} onSubmit={(code, shared) => {
            setBusy(true);
            void open(credentials, code, shared);
          }}
        />
      )}
      {screen.name === "unavailable" && (
        <main className="page-narrow">
          <H1>{screen.title}</H1>
          <Banner mode="info" withIcon>{screen.message}</Banner>
          {screen.retry && credentials && (
            <Button
              height={ControlsHeight.L}
              className="touch-button"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void open(credentials);
              }}
            >
              Try again
            </Button>
          )}
        </main>
      )}
      {screen.name === "working" && (
        <SortWorkspace
          session={screen.session}
          definition={screen.definition}
          initial={screen.body}
          seed={credentials?.slotSecret ?? ""}
          onSubmitted={(copy) => setScreen({ name: "submitted", definition: screen.definition, copy })}
          onPending={() => setScreen({ name: "sending", session: screen.session, definition: screen.definition })}
        />
      )}
      {screen.name === "sending" && (
        <main className="page-narrow">
          <H1>Sending your sort…</H1>
          <div role="status">
            <Banner mode="info" withIcon>
              Your sort is saved on this device. It will be sent as soon as you&apos;re back online. Keep this page open, or open
              the same link again later.
            </Banner>
          </div>
        </main>
      )}
      {screen.name === "submitted" && <Submitted definition={screen.definition} copy={screen.copy} />}
    </Frame>
  );
}
