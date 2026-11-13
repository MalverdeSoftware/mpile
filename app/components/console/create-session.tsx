"use client";
import { useState } from "react";
import importIcon from "@jetbrains/icons/import";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Checkbox from "@jetbrains/ring-ui-built/components/checkbox/checkbox";
import { H1 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { ErrorMessage, FileButton } from "@malverdesoftware/ui/controls";
import { prepareSession, type SessionFile } from "@malverdesoftware/session-client";
import { Frame } from "../frame";
import { parseCards } from "@/lib/analysis";
import { BASELINE, buildDefinition, parseLabels, type SortDefinition } from "@/lib/session";
import { MAX_CARDS, MAX_NEW_CARDS } from "@/lib/model";
import { PRODUCTION_RELAY, isProductionRelay, participantUrlFor } from "@/lib/console";
import { describe } from "./errors";

export default function CreateSession({
  onPrepared,
  onCancel,
}: {
  onPrepared: (file: SessionFile, definition: SortDefinition) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [cardText, setCardText] = useState("");
  const [labelText, setLabelText] = useState("");
  const [days, setDays] = useState(14);
  const [randomize, setRandomize] = useState(true);
  const [generate, setGenerate] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [maxNew, setMaxNew] = useState(5);
  const [text, setText] = useState(BASELINE);
  const [relayUrl, setRelayUrl] = useState(PRODUCTION_RELAY);
  const [preparing, setPreparing] = useState(0);
  const [error, setError] = useState("");
  const cards = cardText.split(/\r?\n/).filter((t) => t.trim());

  async function importCsv(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 100_000) throw new Error("Use a CSV smaller than 100 KB.");
      setCardText(parseCards(await file.text()).join("\n"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function prepare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const definition = buildDefinition({
        title: title.trim(),
        ...text,
        randomize,
        cardTexts: cards,
        generation: generate ? { prompt: prompt.trim(), maxNewCards: maxNew } : null,
      });
      const participantLabels = parseLabels(labelText);
      if (!participantLabels.length) throw new Error("Add at least one participant code.");
      setPreparing(participantLabels.length);
      const file = await prepareSession({
        app: "mpile",
        title: definition.title,
        relayUrl: relayUrl.trim().replace(/\/+$/, ""),
        participantUrl: participantUrlFor(relayUrl.trim()),
        definition,
        participantLabels,
        expiresInDays: days,
      });
      onPrepared(file, definition);
    } catch (e) {
      setError(describe(e));
      setPreparing(0);
    }
  }

  const field = (key: keyof typeof BASELINE, label: string) => (
    <Input
      multiline
      size={Size.FULL}
      label={label}
      rows={3}
      maxLength={4000}
      value={text[key]}
      onChange={(e) => setText({ ...text, [key]: e.target.value })}
    />
  );
  return (
    <Frame>
      <main className="page-narrow">
        <p className="secondary-text">New session</p>
        <H1>Create a session</H1>
        <form className="panel stack" onSubmit={prepare}>
          <Input
            size={Size.FULL}
            label="Title · participants see this"
            required
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="field-with-action">
            <Input
              multiline
              id="cards"
              size={Size.FULL}
              label={`Cards · ${cards.length} / ${MAX_CARDS}`}
              help="One card per line, or a CSV with a text column. Up to 100 different cards of 300 characters. Use synthetic cards until the readiness check has passed."
              rows={8}
              required
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
            />
            <div className="field-with-action__action">
              <FileButton accept=".csv,text/csv" icon={importIcon} onPick={(file) => void importCsv(file)}>
                Import CSV
              </FileButton>
            </div>
          </div>
          <Input
            multiline
            size={Size.FULL}
            label="Participant codes"
            help="Codes or ranges separated by commas or lines, such as Y01-Y12, Y20. Never use names."
            rows={2}
            required
            value={labelText}
            placeholder="Y01-Y12"
            onChange={(e) => setLabelText(e.target.value)}
          />
          <Input
            type="number"
            size={Size.M}
            label="Days until the session deletes itself"
            min={1}
            max={30}
            required
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
          <Checkbox
            checked={randomize}
            onChange={(e) => setRandomize(e.target.checked)}
            label="Show the cards in a different order to each participant"
          />
          <Checkbox
            checked={generate}
            onChange={(e) => setGenerate(e.target.checked)}
            label="Let participants add their own cards"
          />
          {generate && (
            <div className="stack">
              <Input
                multiline
                size={Size.FULL}
                label="Prompt · participants read this before adding cards"
                help="For example: What else comes to mind? Add a card for each one. Each participant sees only their own cards."
                rows={2}
                required
                maxLength={2000}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Input
                type="number"
                size={Size.M}
                label="Cards each participant may add"
                min={1}
                max={MAX_NEW_CARDS}
                required
                value={maxNew}
                onChange={(e) => setMaxNew(Number(e.target.value))}
              />
            </div>
          )}
          <details className="console-details">
            <summary>What participants read</summary>
            <div className="stack">
              <p className="secondary-text">Adapt the baseline text to your study. Consent and assent happen outside this app.</p>
              {field("instructions", "Instructions")}
              {field("help", "Help")}
              {field("participantInfo", "Participant information")}
            </div>
          </details>
          <details className="console-details" open={!isProductionRelay(relayUrl)}>
            <summary>Relay address</summary>
            <div className="stack">
              <Input size={Size.FULL} aria-label="Relay address" value={relayUrl} onChange={(e) => setRelayUrl(e.target.value)} />
              {!isProductionRelay(relayUrl) && (
                <div role="status">
                  <Banner mode="warning" withIcon>
                    Development relay: links made now work only on this computer. Use {PRODUCTION_RELAY} for a real session.
                  </Banner>
                </div>
              )}
            </div>
          </details>
          <ErrorMessage error={error} />
          <div className="console-actions">
            <Button primary type="submit" disabled={preparing > 0}>
              {preparing ? `Preparing ${preparing} personal links…` : "Prepare session"}
            </Button>
            <Button disabled={preparing > 0} onClick={onCancel}>
              Cancel
            </Button>
          </div>
          {preparing > 0 && (
            <p className="secondary-text" role="status" aria-live="polite">
              Each link gets its own passcode. This takes a few seconds and stays on this computer.
            </p>
          )}
        </form>
      </main>
    </Frame>
  );
}
