"use client";
import { useState } from "react";
import checkmarkIcon from "@jetbrains/icons/checkmark";
import copyIcon from "@jetbrains/icons/copy";
import type { ParticipantStatus, SessionFile, SessionStatus } from "@malverdesoftware/session-client";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import { H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { ConfirmButton, ErrorMessage } from "@malverdesoftware/ui/controls";
import { parseLabels } from "@/lib/session";

const STATE: Record<ParticipantStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      inline
      icon={copied ? checkmarkIcon : copyIcon}
      aria-label={label}
      onClick={() =>
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export default function ParticipantsPanel({
  file,
  status,
  busy,
  justPublished,
  onAdd,
  onRevoke,
}: {
  file: SessionFile;
  status: SessionStatus | null;
  busy: boolean;
  justPublished: boolean;
  onAdd: (labels: string[]) => Promise<void>;
  onRevoke: (label: string) => Promise<void>;
}) {
  const [newLabels, setNewLabels] = useState("");
  const [error, setError] = useState("");
  const active = file.participants.filter((p) => !p.revokedAt);
  const state = new Map(status?.participants.map((p) => [p.label, p]));
  const unknown = status?.participants.filter((p) => p.label === null).length ?? 0;
  const done = status?.participants.filter((p) => p.status === "SUBMITTED").length ?? 0;

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const labels = parseLabels(newLabels);
      if (labels.length) void onAdd(labels).then(() => setNewLabels(""));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section className="panel stack">
      <div className="console-heading">
        <H2>Participants</H2>
        {status && (
          <span className="count-badge">
            {done} of {active.length} submitted
          </span>
        )}
      </div>
      {justPublished && (
        <div role="status">
          <Banner mode="success" withIcon>
            Published. Send each person only their own link and passcode, through different channels if you can (for
            example the link by text and the passcode in person).
          </Banner>
        </div>
      )}
      <div className="table-scroll">
        <table className="console-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Status</th>
              <th>Last update</th>
              <th>Link</th>
              <th>Passcode</th>
              <th>
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {active.map((p) => {
              const s = state.get(p.label);
              return (
                <tr key={p.label}>
                  <td>
                    <strong>{p.label}</strong>
                  </td>
                  <td>{s ? STATE[s.status] : "…"}</td>
                  <td>{s?.updatedAt ? new Date(s.updatedAt).toLocaleString() : "—"}</td>
                  <td>
                    <CopyButton text={p.link} label={`Copy ${p.label}'s link`} />
                  </td>
                  <td>
                    <span className="mono">{p.passcode}</span> <CopyButton text={p.passcode} label={`Copy ${p.label}'s passcode`} />
                  </td>
                  <td>
                    <ConfirmButton
                      inline
                      danger
                      label="Remove"
                      disabled={busy}
                      title={`Remove ${p.label}?`}
                      confirmLabel="Remove and delete their data"
                      cancelLabel={`Keep ${p.label}`}
                      onConfirm={() => void onRevoke(p.label)}
                    >
                      <p>
                        Their link stops working, and their saved draft or submitted sort is deleted from the relay.
                        This can&apos;t be undone.
                      </p>
                    </ConfirmButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {unknown > 0 && (
        <p className="secondary-text">
          {unknown === 1 ? "1 participant was" : `${unknown} participants were`} added in a newer copy of this key file.
          Open that copy to see them.
        </p>
      )}
      {!status?.isClosed && (
        <form className="console-add" onSubmit={add}>
          <Input
            size={Size.M}
            aria-label="Participant codes to add"
            placeholder="Y13-Y14"
            value={newLabels}
            onChange={(e) => setNewLabels(e.target.value)}
          />
          <Button type="submit" disabled={busy || !newLabels.trim()}>
            Add
          </Button>
        </form>
      )}
      <ErrorMessage error={error} />
    </section>
  );
}
