"use client";
import { useState } from "react";
import folderIcon from "@jetbrains/icons/folder";
import { parseSessionFile, readDefinition as openDefinition, type SessionFile } from "@malverdesoftware/session-client";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import { H1, H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import { ErrorMessage, FileButton } from "@malverdesoftware/ui/controls";
import { Frame } from "../frame";
import "./console.css";
import { readDefinition, type SortDefinition } from "@/lib/session";
import CreateSession from "./create-session";
import PublishSteps from "./publish-steps";
import SessionView from "./session-view";

type View =
  | { name: "home" }
  | { name: "create" }
  | { name: "prepared"; file: SessionFile; definition: SortDefinition }
  | { name: "session"; file: SessionFile; definition: SortDefinition; justPublished: boolean };

// Session secrets live only in this page's memory and in the key file the researcher saves.
export default function ConsolePage() {
  const [view, setView] = useState<View>({ name: "home" });
  const [error, setError] = useState("");

  async function openFile(picked: File | undefined) {
    if (!picked) return;
    setError("");
    try {
      const file = parseSessionFile(await picked.text());
      if (file.app !== "mpile") throw new Error("This key file belongs to a different app.");
      setView({ name: "session", file, definition: readDefinition(await openDefinition(file)), justPublished: false });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (view.name === "create")
    return (
      <CreateSession
        onCancel={() => setView({ name: "home" })}
        onPrepared={(file, definition) => setView({ name: "prepared", file, definition })}
      />
    );
  if (view.name === "prepared")
    return (
      <PublishSteps
        file={view.file}
        onPublished={() => setView({ name: "session", file: view.file, definition: view.definition, justPublished: true })}
      />
    );
  if (view.name === "session")
    return (
      <SessionView
        key={view.file.sessionId}
        initialFile={view.file}
        definition={view.definition}
        justPublished={view.justPublished}
        onExit={() => setView({ name: "home" })}
      />
    );
  return (
    <Frame>
      <main className="page-narrow">
        <p className="secondary-text">Researcher console · this computer only</p>
        <H1>Run a sealed pile sort.</H1>
        <p>
          Create a session and send each participant a personal link and passcode. Later, open the saved key file here
          to see who has finished, collect and export the sorts, then close and delete the session.
        </p>
        <section className="panel stack">
          <H2>New session</H2>
          <p>Add the cards and participant codes, save the key file, then publish.</p>
          <div>
            <Button primary onClick={() => setView({ name: "create" })}>
              Create a session
            </Button>
          </div>
        </section>
        <section className="panel stack">
          <H2>Existing session</H2>
          <p>Open the key file you saved when you created the session.</p>
          <div>
            <FileButton accept=".md,text/markdown" icon={folderIcon} onPick={(file) => void openFile(file)}>
              Open a key file
            </FileButton>
          </div>
          <ErrorMessage error={error} />
        </section>
        <p className="secondary-text">
          The key file can open every response in its session. Keep it on this computer and in one secure place your
          study has approved for its files, and nowhere else.
        </p>
      </main>
    </Frame>
  );
}
