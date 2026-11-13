"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import downloadIcon from "@jetbrains/icons/download";
import updateIcon from "@jetbrains/icons/update";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import { H1 } from "@jetbrains/ring-ui-built/components/heading/heading";
import { ConfirmDialog, ErrorMessage, withIcon } from "@malverdesoftware/ui/controls";
import {
  SessionError,
  openResearcherSession,
  renderSessionFile,
  type SessionFile,
  type SessionStatus,
} from "@malverdesoftware/session-client";
import { Frame } from "../frame";
import { download } from "@/lib/client";
import { isProductionRelay, keyFileName, summarize, type Collection } from "@/lib/console";
import type { SortDefinition } from "@/lib/session";
import { describe } from "./errors";
import FinishPanel from "./finish-panel";
import ParticipantsPanel from "./participants-panel";
import ResultsPanel from "./results-panel";
import { useUnsavedGuard } from "./use-unsaved-guard";

export default function SessionView({
  initialFile,
  definition,
  justPublished,
  onExit,
}: {
  initialFile: SessionFile;
  definition: SortDefinition;
  justPublished: boolean;
  onExit: () => void;
}) {
  const researcher = useMemo(() => openResearcherSession(initialFile), [initialFile]);
  const [file, setFile] = useState(initialFile);
  const [unsaved, setUnsaved] = useState(false);
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [collection, setCollection] = useState<{ result: Collection; afterClose: boolean } | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useUnsavedGuard(unsaved);

  // Every relay action goes through here: one at a time, with its error shown in plain language.
  const act = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);
      setError("");
      try {
        await action();
      } catch (e) {
        setError(describe(e, researcher.file.relayUrl));
      } finally {
        setBusy(false);
      }
    },
    [researcher],
  );
  const refresh = () => act(async () => setStatus(await researcher.status()));
  // A session the relay no longer has (deleted or expired) offers nothing to manage; its key file stays readable.
  const [gone, setGone] = useState(false);
  useEffect(() => {
    let current = true;
    researcher.status().then(
      (s) => current && setStatus(s),
      (e) => {
        if (!current) return;
        setError(describe(e, researcher.file.relayUrl));
        setGone(e instanceof SessionError && (e.code === "NOT_FOUND" || e.code === "SESSION_EXPIRED"));
      },
    );
    return () => {
      current = false;
    };
  }, [researcher]);

  const changeFile = (next: SessionFile) => {
    setFile(next);
    setUnsaved(true);
  };
  const saveFile = () => {
    download(keyFileName(file.title), renderSessionFile(file), "text/markdown;charset=utf-8");
    setUnsaved(false);
  };
  const expires = status && new Date(status.expiresAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
  const state = deleted
    ? "Deleted from the relay."
    : gone
      ? "Not on the relay."
      : status
        ? `${status.isClosed ? "Closed" : "Open"} · deletes itself ${expires}`
        : error
          ? "Status unavailable."
          : "Checking the relay…";

  return (
    <Frame>
      <main className="page-wide">
        <div className="console-heading">
          <div>
            <p className="secondary-text">Researcher console · session</p>
            <H1>{file.title}</H1>
            <p className="secondary-text">{state}</p>
          </div>
          <div className="console-actions">
            <Button disabled={busy || deleted || gone} onClick={() => void refresh()}>
              {withIcon(updateIcon, "Refresh")}
            </Button>
            <Button onClick={() => (unsaved ? setLeaving(true) : onExit())}>Done</Button>
          </div>
        </div>
        {!isProductionRelay(file.relayUrl) && (
          <Banner mode="warning" withIcon>Development relay ({file.relayUrl}): these links work only on this computer.</Banner>
        )}
        {unsaved && (
          <div role="status" className="console-unsaved">
            <Banner mode="warning" withIcon>
              <span className="console-unsaved__body">
                The participant list changed. Save the updated key file, and replace your second copy with it.
                <Button primary onClick={saveFile}>
                  {withIcon(downloadIcon, "Save key file")}
                </Button>
              </span>
            </Banner>
          </div>
        )}
        <ErrorMessage error={error} />
        {!deleted && !gone && (
          <ParticipantsPanel
            file={file}
            status={status}
            busy={busy}
            justPublished={justPublished}
            onAdd={(labels) =>
              act(async () => {
                changeFile(await researcher.addParticipants(labels));
                setStatus(await researcher.status());
              })
            }
            onRevoke={(label) =>
              act(async () => {
                changeFile(await researcher.revokeParticipant(label));
                setStatus(await researcher.status());
              })
            }
          />
        )}
        {!gone && (
          <>
            <ResultsPanel
              title={file.title}
              collection={collection?.result ?? null}
              busy={busy}
              deleted={deleted}
              onCollect={() =>
                act(async () => {
                  const items = await researcher.collect({ includeDrafts: true });
                  setCollection({ result: summarize(definition, items), afterClose: !!status?.isClosed });
                })
              }
            />
            <FinishPanel
              isClosed={!!status?.isClosed}
              collectedAfterClose={!!collection?.afterClose}
              deleted={deleted}
              busy={busy}
              onClose={() => act(async () => setStatus(await researcher.close()))}
              onDelete={() =>
                act(async () => {
                  await researcher.destroy();
                  setDeleted(true);
                })
              }
            />
          </>
        )}
      </main>
      <ConfirmDialog
        show={leaving}
        title="Leave without saving?"
        confirmLabel="Leave anyway"
        cancelLabel="Stay"
        onCancel={() => setLeaving(false)}
        onConfirm={onExit}
      >
        <p>The updated key file isn&apos;t saved yet.</p>
      </ConfirmDialog>
    </Frame>
  );
}
