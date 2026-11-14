"use client";
import { useState } from "react";
import downloadIcon from "@jetbrains/icons/download";
import folderIcon from "@jetbrains/icons/folder";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Checkbox from "@jetbrains/ring-ui-built/components/checkbox/checkbox";
import { H1, H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { ErrorMessage, FileButton, withIcon } from "@malverdesoftware/ui/controls";
import { publishSession, renderSessionFile, verifySessionFile, type SessionFile } from "@malverdesoftware/session-client";
import { Frame } from "../frame";
import { download, readKey, removeKey, writeKey } from "@/lib/client";
import { CREATION_KEY_STORAGE, isProductionRelay, keyFileName } from "@/lib/console";
import { describe } from "./errors";
import { useUnsavedGuard } from "./use-unsaved-guard";

// Save the key file (twice), open the saved copy to prove it works, then publish. Publishing is safe to retry: the request is rebuilt from the file.
export default function PublishSteps({ file, onPublished }: { file: SessionFile; onPublished: () => void }) {
  const [saved, setSaved] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checkError, setCheckError] = useState("");
  const [secondCopy, setSecondCopy] = useState(false);
  const [creationKey, setCreationKey] = useState(() => readKey(CREATION_KEY_STORAGE) ?? "");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useUnsavedGuard(!saved);

  // Opens the file the researcher actually saved, not the copy in memory, so a damaged or wrong file is caught
  // while the session can still be prepared again.
  async function check(picked: File | undefined) {
    if (!picked) return;
    setCheckError("");
    setVerified(false);
    try {
      await verifySessionFile(await picked.text(), file);
      setVerified(true);
    } catch (e) {
      setCheckError((e as Error).message);
    }
  }

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
          {saved && (
            <>
              <p>Then open the file you saved, to check it can open the responses. Nothing leaves this computer.</p>
              <div>
                <FileButton accept=".md,text/markdown" icon={folderIcon} onPick={(f) => void check(f)}>
                  Check the saved key file
                </FileButton>
              </div>
            </>
          )}
          {verified && (
            <Banner mode="success" withIcon>The saved key file opens this session&apos;s responses.</Banner>
          )}
          <ErrorMessage error={checkError} />
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
            <Button primary type="submit" disabled={busy || !verified || !secondCopy || !creationKey.trim()}>
              {busy ? "Publishing…" : "Publish the session"}
            </Button>
          </div>
          {(!verified || !secondCopy) && (
            <p className="secondary-text">Save the key file, check it, and save its second copy first.</p>
          )}
        </form>
      </main>
    </Frame>
  );
}
