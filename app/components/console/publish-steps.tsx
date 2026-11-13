"use client";
import { useState } from "react";
import downloadIcon from "@jetbrains/icons/download";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Checkbox from "@jetbrains/ring-ui-built/components/checkbox/checkbox";
import { H1, H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { ErrorMessage, withIcon } from "@malverdesoftware/ui/controls";
import { publishSession, renderSessionFile, type SessionFile } from "@malverdesoftware/session-client";
import { Frame } from "../frame";
import { download, readKey, removeKey, writeKey } from "@/lib/client";
import { CREATION_KEY_STORAGE, isProductionRelay, keyFileName } from "@/lib/console";
import { describe } from "./errors";
import { useUnsavedGuard } from "./use-unsaved-guard";

// Save the key file (twice), then publish. Publishing is safe to retry: the request is rebuilt from the file.
export default function PublishSteps({ file, onPublished }: { file: SessionFile; onPublished: () => void }) {
  const [saved, setSaved] = useState(false);
  const [secondCopy, setSecondCopy] = useState(false);
  const [creationKey, setCreationKey] = useState(() => readKey(CREATION_KEY_STORAGE) ?? "");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useUnsavedGuard(!saved);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await publishSession(file, { creationKey: creationKey.trim() });
      if (remember) writeKey(CREATION_KEY_STORAGE, creationKey.trim());
      else removeKey(CREATION_KEY_STORAGE);
      onPublished();
    } catch (e) {
      setError(describe(e, file.relayUrl));
    } finally {
      setBusy(false);
    }
  }

  const active = file.participants.filter((p) => !p.revokedAt).length;
  return (
    <Frame>
      <main className="page-narrow">
        <p className="secondary-text">New session · not published yet</p>
        <H1>{file.title}</H1>
        <p>
          {active === 1 ? "1 personal link is" : `${active} personal links are`} ready. The session deletes itself{" "}
          {file.expiresInDays} days after publishing.
        </p>
        {!isProductionRelay(file.relayUrl) && (
          <Banner mode="warning" withIcon>Development relay ({file.relayUrl}): these links work only on this computer.</Banner>
        )}
        <section className="panel stack">
          <H2>1. Save the key file</H2>
          <p>
            It is the only way to read the responses. If it is lost, nobody can recover them. It also holds every link
            and passcode.
          </p>
          <div>
            <Button
              primary={!saved}
              onClick={() => {
                download(keyFileName(file.title), renderSessionFile(file), "text/markdown;charset=utf-8");
                setSaved(true);
              }}
            >
              {withIcon(downloadIcon, saved ? "Download again" : "Download the key file")}
            </Button>
          </div>
          <Checkbox
            checked={secondCopy}
            onChange={(e) => setSecondCopy(e.target.checked)}
            label="I also saved a second copy in a secure place our study has approved for its files."
          />
        </section>
        <form className="panel stack" onSubmit={publish}>
          <H2>2. Publish</H2>
          <Input
            type="password"
            size={Size.FULL}
            label="Creation key"
            autoComplete="off"
            required
            value={creationKey}
            onChange={(e) => setCreationKey(e.target.value)}
          />
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            label="Remember the creation key on this computer"
          />
          <ErrorMessage error={error} />
          <div>
            <Button primary type="submit" disabled={busy || !saved || !secondCopy || !creationKey.trim()}>
              {busy ? "Publishing…" : "Publish the session"}
            </Button>
          </div>
          {(!saved || !secondCopy) && <p className="secondary-text">Save the key file and its second copy first.</p>}
        </form>
      </main>
    </Frame>
  );
}
